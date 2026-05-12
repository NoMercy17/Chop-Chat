const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware');
const { analyzeDish, DAILY_QUOTA } = require('../services/gemini');
const cloudinary = require('../services/cloudinary');

// IP-level burst guard — separate from (and in addition to) the per-user daily quota
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'too_many_requests', message: 'Too many requests. Please slow down.' },
});

const cleanupLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'too_many_requests', message: 'Too many requests. Please slow down.' },
});

const AI_ERROR_CODES = new Set(['GEMINI_API_ERROR', 'GEMINI_PARSE_ERROR', 'GEMINI_IMAGE_FETCH_ERROR', 'GEMINI_RATE_LIMIT']);

router.post('/analyze', aiLimiter, authenticateToken, async (req, res) => {
  const { image_url, title, description, ingredients, difficulty, cook_time } = req.body;

  if (!image_url?.trim()) return res.status(400).json({ error: 'image_url is required' });
  if (!title?.trim())     return res.status(400).json({ error: 'title is required' });

  const userId = req.user.id;

  try {
    const { rows: usageRows } = await pool.query(
      `SELECT COUNT(*) AS used FROM ai_review_logs
       WHERE user_id = $1 AND created_at > NOW() - INTERVAL '24 hours'`,
      [userId]
    );
    const used = parseInt(usageRows[0].used, 10);

    if (used >= DAILY_QUOTA) {
      return res.status(429).json({
        error: 'daily_quota_exceeded',
        message: `You've used all ${DAILY_QUOTA} AI reviews for today. Try again tomorrow.`,
        quota: { used, limit: DAILY_QUOTA },
      });
    }

    const review = await analyzeDish({
      imageUrl:    image_url.trim(),
      title:       title.trim(),
      description: description?.trim() || '',
      ingredients: ingredients || [],
      difficulty:  difficulty  || '',
      cookTime:    cook_time   || '',
    });

    const isFeedEligible = review.isFood && !['fruit', 'vegetable', 'non_food'].includes(review.foodCategory);

    // Log usage only after a successful Gemini response — failed calls don't count.
    // image_url is stored so POST /posts can verify the image was already AI-reviewed
    // and skip the redundant validateFoodImage call on the share path.
    await pool.query(
      'INSERT INTO ai_review_logs (user_id, image_url, is_feed_eligible) VALUES ($1, $2, $3)',
      [userId, image_url.trim(), isFeedEligible]
    );

    res.json({
      review,
      quota: { used: used + 1, limit: DAILY_QUOTA },
    });
  } catch (err) {
    console.error('[POST /ai/analyze]', err.message);
    if (err.code === 'GEMINI_RATE_LIMIT') {
      return res.status(429).json({
        error: 'ai_rate_limited',
        message: 'AI service is temporarily busy. Please try again in a minute.',
      });
    }
    if (AI_ERROR_CODES.has(err.code)) {
      return res.status(503).json({
        error: 'ai_unavailable',
        message: 'AI analysis failed. Please try again.',
      });
    }
    res.status(500).json({ error: 'server error' });
  }
});

// Deletes a Cloudinary image uploaded during AI analysis that the user discarded
// (closed the result modal without sharing to feed).
// Uses query param so no changes to api.delete() signature are needed on the client.
router.delete('/cleanup', cleanupLimiter, authenticateToken, async (req, res) => {
  const { public_id } = req.query;

  if (!public_id?.trim()) return res.status(400).json({ error: 'public_id is required' });

  // Allow only images in the posts/ folder — prevents using this endpoint to delete
  // arbitrary Cloudinary resources (e.g., profile photos).
  const safe = public_id.trim();
  if (!safe.startsWith('posts/') || safe.includes('..')) {
    return res.status(403).json({ error: 'invalid public_id' });
  }

  try {
    await cloudinary.uploader.destroy(safe);
    res.json({ deleted: true });
  } catch (err) {
    console.error('[DELETE /ai/cleanup]', err.message);
    res.status(500).json({ error: 'cleanup failed' });
  }
});

module.exports = router;
