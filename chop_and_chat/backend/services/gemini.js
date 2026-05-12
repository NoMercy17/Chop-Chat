const { GoogleGenerativeAI } = require('@google/generative-ai');
const https = require('https');
const http = require('http');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: 'gemini-flash-lite-latest',
  generationConfig: {
    responseMimeType: 'application/json',
  }
});

const DAILY_QUOTA = 3;

// Resize via Cloudinary URL transformation to reduce payload size sent to Gemini.
// w_800: cap width at 800px; f_jpg: force JPEG output; q_70: 70% quality
function transformCloudinaryUrl(url) {
  if (url.includes('/upload/')) {
    return url.replace('/upload/', '/upload/w_800,c_scale,f_jpg,q_70/');
  }
  return url;
}

// Fetches an image from a URL and returns raw bytes as a Buffer.
// Follows a single level of HTTP redirect (Cloudinary never chains more than one).
function fetchImageBuffer(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchImageBuffer(res.headers.location));
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Image fetch failed with status ${res.statusCode}`));
      }
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    });
    req.on('error', reject);
    // 15s timeout guards against stalled Cloudinary fetches holding a request open
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error('Image fetch timed out'));
    });
  });
}

function buildPrompt({ title, description, ingredients, difficulty, cookTime }) {
  const ingredientsList = Array.isArray(ingredients) && ingredients.length
    ? ingredients.join(', ')
    : 'Not provided';

  return `You are an AI food reviewer integrated into a mobile food-sharing application.
Your role is to analyze uploaded food-related images and generate concise, realistic, structured reviews.

IMPORTANT BEHAVIOR RULES:

1. STRICT FOOD DETECTION
- First determine whether the image actually contains edible food.
- Valid food includes: cooked meals, recipes, plated dishes, desserts, fruits, vegetables, drinks, bakery items, snacks.

2. NON-FOOD IMAGES
If the image is NOT food-related (cars, rooms, people, animals, screenshots, random objects, landscapes, memes, etc.):
- Clearly state that the image is not suitable for a food review.
- Be simple, direct, and slightly playful.
- Give very low ratings.
- DO NOT hallucinate food qualities.
- DO NOT generate fake compliments.
- DO NOT show sections like: "What works well", advanced cooking feedback, plating analysis.
- Example tone: "This doesn't appear to be a food photo suitable for culinary review."
- ratings should stay extremely low.
- summary should stay short.
- pro tip can be playful: "Something edible next time!"

3. FRUITS / VEGETABLES HANDLING
If the image contains ONLY raw fruits or vegetables:
- Acknowledge that it is edible food.
- Mention freshness, color, quality, texture, or presentation.
- IMPORTANT: explain that it is not a full recipe or prepared dish, do not invent cooking techniques or flavors, do not overpraise simple ingredients.
- moderate scores only, avoid very high ratings unless visually exceptional.
- "What works well" should remain minimal.
- "Room to improve" should mention: preparation, pairing, plating, turning ingredients into a complete dish.

4. RATING STRICTNESS
The model must be HARDER TO IMPRESS. Avoid inflated ratings.
Scoring philosophy:
- 9–10: exceptional restaurant-quality presentation and execution
- 7–8: genuinely strong homemade or professional dish
- 5–6: average/decent food
- 3–4: weak execution or very basic food
- 0–2: non-food or extremely poor quality

5. SHORTER SUMMARIES
The initial summary/description should be concise. Maximum: 3–4 short lines, not long paragraphs, avoid repeating the same observations.

6. HONEST FEEDBACK
Be direct and realistic. Avoid fake positivity. Do not praise every upload. If something looks mediocre: say it politely but honestly.

7. WHAT WORKS WELL SECTION
This section should only appear if there are genuinely positive aspects (e.g. good plating, appetizing texture, color contrast, strong presentation, quality ingredients).
For random/non-food images: omit this section entirely.
For fruits: keep it very short (e.g. "High-quality fresh produce.").

8. ROOM TO IMPROVE SECTION
This section should adapt to the image type.
- cooked dishes: plating, balance, garnish, texture, lighting
- fruits/vegetables: preparation, composition, turning ingredients into a dish
- non-food: explain the upload is unrelated to food reviewing

9. PRO TIP SECTION
Tailor the pro tip to the context.
- Cooked dish: "Try adding height variation in plating for a more premium presentation."
- Fruit: "Pairing these ingredients into a finished dish would create a more complete review."
- Non-food: "Something edible next time!"

10. RESPONSE FORMAT
Return valid JSON only.

Structure:
{
"isFood": boolean,
"foodCategory": "dish | fruit | vegetable | dessert | drink | non_food | other",
"overallScore": number,
"summary": string,
"whatWorksWell": [string],
"roomToImprove": [string],
"proTip": string,
"detectedItems": [string]
}

11. IMPORTANT CONSTRAINTS
- Never invent ingredients you cannot clearly see.
- Never pretend random objects are food.
- Never overpraise average uploads.
- Never produce long reviews.
- Keep feedback sharp, modern, and realistic.
- Tone should feel like a strict but fair food reviewer.
- Maintain concise mobile-app-friendly output.

DISH DETAILS PROVIDED BY USER:
- Name: ${title}
- Description: ${description || 'Not provided'}
- Ingredients: ${ingredientsList}
- Difficulty: ${difficulty || 'Not specified'}
- Cook Time: ${cookTime || 'Not specified'}
`;
}

function parseResponse(rawText) {
  // Strip markdown code fences Gemini sometimes wraps around JSON
  let text = rawText.trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/,      '')
    .replace(/\s*```$/,      '');

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]+\}/);
    if (!match) {
      const err = new Error('Could not extract JSON from Gemini response');
      err.code = 'GEMINI_PARSE_ERROR';
      throw err;
    }
    parsed = JSON.parse(match[0]);
  }

  const overallRaw = parseFloat(parsed.overallScore) || 0;
  const overall_score = Math.round(Math.min(10, Math.max(0, overallRaw)) * 10) / 10;

  return {
    isFood:       !!parsed.isFood,
    foodCategory: String(parsed.foodCategory || 'other'),
    overall_score,
    summary:      String(parsed.summary || ''),
    strengths:    (parsed.whatWorksWell || []).slice(0, 4).map(String),
    improvements: (parsed.roomToImprove || []).slice(0, 3).map(String),
    chef_tip:     String(parsed.proTip || ''),
    detectedItems:(parsed.detectedItems || []).map(String),
  };
}

async function validateFoodImage(imageUrl) {
  const resizedUrl = transformCloudinaryUrl(imageUrl);

  let imageBuffer;
  try {
    imageBuffer = await fetchImageBuffer(resizedUrl);
  } catch (err) {
    const fetchErr = new Error(`Failed to fetch image for validation: ${err.message}`);
    fetchErr.code = 'GEMINI_IMAGE_FETCH_ERROR';
    throw fetchErr;
  }

  const prompt = `You are a strict content moderator for a recipe and food-sharing app.
Determine if the provided image is eligible to be posted on the community feed.

RULES FOR ELIGIBILITY:
1. The image MUST contain edible food.
2. The image MUST be a prepared dish, cooked meal, dessert, baked good, or a complex recipe.
3. Raw, unprepared fruits (e.g. a plain apple, a banana) or vegetables (e.g. a raw potato) are NOT eligible.
4. Non-food items, screenshots, people, cars, memes, or random objects are NOT eligible.

Return ONLY a JSON object with this exact structure:
{
  "isValidForFeed": boolean,
  "reason": "A very short, one-sentence explanation"
}
`;

  try {
    const callPromise = model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: imageBuffer.toString('base64'),
        },
      },
    ]);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Gemini validation timed out')), 12000)
    );
    const geminiResult = await Promise.race([callPromise, timeoutPromise]);

    let text = geminiResult.response.text().trim()
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/, '')
      .replace(/\s*```$/, '');

    const parsed = JSON.parse(text);
    return {
      isValidForFeed: !!parsed.isValidForFeed,
      reason: String(parsed.reason || 'Image validation failed.')
    };
  } catch (err) {
    console.error('[validateFoodImage] error:', err.message);
    // On API failure or timeout, fail open so users aren't blocked by Gemini downtime
    return { isValidForFeed: true, reason: 'Validation skipped due to API error.' };
  }
}

async function analyzeDish({ imageUrl, title, description, ingredients, difficulty, cookTime }) {
  const resizedUrl = transformCloudinaryUrl(imageUrl);

  let imageBuffer;
  try {
    imageBuffer = await fetchImageBuffer(resizedUrl);
  } catch (err) {
    const fetchErr = new Error(`Failed to fetch dish image: ${err.message}`);
    fetchErr.code = 'GEMINI_IMAGE_FETCH_ERROR';
    throw fetchErr;
  }

  const prompt = buildPrompt({ title, description, ingredients, difficulty, cookTime });

  let geminiResult;
  try {
    geminiResult = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: imageBuffer.toString('base64'),
        },
      },
    ]);
  } catch (err) {
    if (err.message?.includes('429')) {
      const rateErr = new Error(`Gemini API call failed: ${err.message}`);
      rateErr.code = 'GEMINI_RATE_LIMIT';
      throw rateErr;
    }
    const apiErr = new Error(`Gemini API call failed: ${err.message}`);
    apiErr.code = 'GEMINI_API_ERROR';
    throw apiErr;
  }

  const rawText = geminiResult.response.text();
  return parseResponse(rawText);
}

module.exports = { analyzeDish, validateFoodImage, DAILY_QUOTA };
