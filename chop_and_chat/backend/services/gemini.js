const { GoogleGenerativeAI } = require('@google/generative-ai');
const https = require('https');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Three-model fallback chain — each has its own free-tier quota bucket.
// Order: newest → stable pinned → oldest. If one hits 429, the next is tried automatically.
const MODEL_NAMES = [
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash-lite',
  'gemini-2.5-flash',
];
const MODEL_CHAIN = MODEL_NAMES.map(name =>
  genAI.getGenerativeModel({ model: name, generationConfig: { responseMimeType: 'application/json' } })
);

const DAILY_QUOTA = 3;


// Extracts the Cloudinary public ID from a stored image URL.
// Uses plain string operations — no regex on user input to avoid ReDoS.
// Accepts only paths under known upload folders: posts/ or profile_photos/
// e.g. ".../upload/posts/abc123.jpg"          → "posts/abc123"
//      ".../upload/v1234/profile_photos/x.jpg" → "profile_photos/x"
const KNOWN_FOLDERS = ['posts/', 'profile_photos/'];
const PUBLIC_ID_RE = /^(posts|profile_photos)\/[\w.\-]+$/;

function extractPublicId(url) {
  let pathname;
  try {
    pathname = new URL(url).pathname;
  } catch {
    throw Object.assign(new Error('Invalid image URL'), { code: 'INVALID_IMAGE_URL' });
  }

  const uploadMarker = '/upload/';
  const uploadIdx = pathname.indexOf(uploadMarker);
  if (uploadIdx === -1) {
    throw Object.assign(new Error('Image URL is not from a recognised Cloudinary folder'), { code: 'INVALID_IMAGE_URL' });
  }

  const afterUpload = pathname.slice(uploadIdx + uploadMarker.length);

  // Find the first known folder segment — skips version/transformation prefixes
  let folderStart = -1;
  for (const folder of KNOWN_FOLDERS) {
    const idx = afterUpload.indexOf(folder);
    if (idx !== -1 && (folderStart === -1 || idx < folderStart)) {
      folderStart = idx;
    }
  }
  if (folderStart === -1) {
    throw Object.assign(new Error('Image URL is not from a recognised Cloudinary folder'), { code: 'INVALID_IMAGE_URL' });
  }

  const withFolder = afterUpload.slice(folderStart);
  const dotIdx = withFolder.lastIndexOf('.');
  const publicId = dotIdx !== -1 ? withFolder.slice(0, dotIdx) : withFolder;

  if (!PUBLIC_ID_RE.test(publicId)) {
    throw Object.assign(new Error('Image public ID contains invalid characters'), { code: 'INVALID_IMAGE_URL' });
  }

  return publicId;
}

// Builds the resized fetch URL from server-controlled components only.
// The hostname and cloud name come from env — not from user input.
function buildCloudinaryFetchUrl(publicId) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  if (!cloudName) throw new Error('CLOUDINARY_CLOUD_NAME is not configured');
  return `https://res.cloudinary.com/${cloudName}/image/upload/w_800,c_scale,f_jpg,q_70/${publicId}`;
}

// Fetches an image from a URL and returns raw bytes as a Buffer.
// Follows a single level of HTTP redirect (Cloudinary never chains more than one).
function fetchImageBuffer(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // Redirect must also stay on res.cloudinary.com
        const loc = res.headers.location;
        if (!loc.startsWith('https://res.cloudinary.com/')) {
          return reject(Object.assign(new Error('Redirect to unexpected host blocked'), { code: 'INVALID_IMAGE_URL' }));
        }
        return resolve(fetchImageBuffer(loc));
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

// Tries each model in MODEL_CHAIN in order. Falls back to the next only on 429 or 503 errors.
// Any other error (timeout, parse failure, network) is re-thrown immediately from the model
// that produced it — don't waste retries on non-quota failures.
// Throws GEMINI_QUOTA_EXCEEDED if all models are exhausted on quota or capacity.
async function tryModelChain(callFn) {
  for (let i = 0; i < MODEL_CHAIN.length; i++) {
    try {
      return await callFn(MODEL_CHAIN[i]);
    } catch (err) {
      if (err.message?.includes('429') || err.message?.includes('503')) {
        const hasNext = i < MODEL_CHAIN.length - 1;
        console.warn(`[Gemini] ${MODEL_NAMES[i]} unavailable (429/503)${hasNext ? `, trying ${MODEL_NAMES[i + 1]}` : ''}`);
        if (hasNext) continue;
        const quotaErr = new Error('Image validation temporarily unavailable. Please try again in a few minutes.');
        quotaErr.code = 'GEMINI_QUOTA_EXCEEDED';
        throw quotaErr;
      }
      throw err;
    }
  }
}

async function validateFoodImage(imageUrl) {
  const publicId = extractPublicId(imageUrl);
  const fetchUrl = buildCloudinaryFetchUrl(publicId);

  let imageBuffer;
  try {
    imageBuffer = await fetchImageBuffer(fetchUrl);
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

  const inlineData = { inlineData: { mimeType: 'image/jpeg', data: imageBuffer.toString('base64') } };

  try {
    return await tryModelChain(async (m) => {
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Gemini validation timed out')), 12000)
      );
      const result = await Promise.race([m.generateContent([prompt, inlineData]), timeout]);
      let text = result.response.text().trim()
        .replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/\s*```$/, '');
      const parsed = JSON.parse(text);
      return { isValidForFeed: !!parsed.isValidForFeed, reason: String(parsed.reason || 'Image validation failed.') };
    });
  } catch (err) {
    if (err.code === 'GEMINI_QUOTA_EXCEEDED') throw err;
    // Fail closed on API errors so we don't let invalid photos bypass the review
    console.error('[validateFoodImage] error:', err.message);
    return { isValidForFeed: false, reason: 'AI validation is temporarily unavailable due to high server load. Please try again.' };
  }
}

async function analyzeDish({ imageUrl, title, description, ingredients, difficulty, cookTime }) {
  const publicId = extractPublicId(imageUrl);
  const fetchUrl = buildCloudinaryFetchUrl(publicId);

  let imageBuffer;
  try {
    imageBuffer = await fetchImageBuffer(fetchUrl);
  } catch (err) {
    const fetchErr = new Error(`Failed to fetch dish image: ${err.message}`);
    fetchErr.code = 'GEMINI_IMAGE_FETCH_ERROR';
    throw fetchErr;
  }

  const prompt = buildPrompt({ title, description, ingredients, difficulty, cookTime });
  const inlineData = { inlineData: { mimeType: 'image/jpeg', data: imageBuffer.toString('base64') } };

  try {
    const result = await tryModelChain(async (m) => {
      return await m.generateContent([prompt, inlineData]);
    });
    return parseResponse(result.response.text());
  } catch (err) {
    if (err.code === 'GEMINI_QUOTA_EXCEEDED') {
      const rateErr = new Error(`Gemini API call failed: ${err.message}`);
      rateErr.code = 'GEMINI_RATE_LIMIT';
      throw rateErr;
    }
    const apiErr = new Error(`Gemini API call failed: ${err.message}`);
    apiErr.code = 'GEMINI_API_ERROR';
    throw apiErr;
  }
}

module.exports = { analyzeDish, validateFoodImage, DAILY_QUOTA };
