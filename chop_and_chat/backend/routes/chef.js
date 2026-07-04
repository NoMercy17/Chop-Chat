const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const pool = require('../db');
const { authenticateToken, requireChef } = require('../middleware');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { validateFoodImage } = require('../services/gemini');
const { moderateText } = require('../services/moderation');
const cloudinary = require('../services/cloudinary');
const { relativeTime, initials, getPublicIdFromUrl } = require('../utils/helpers');
const { shouldNotify } = require('../utils/notificationPrefs');

const reviewRequestLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10,  standardHeaders: true, legacyHeaders: false });
const feedLimiter          = rateLimit({ windowMs: 15 * 60 * 1000, max: 120, standardHeaders: true, legacyHeaders: false });
const commentsReadLimiter  = rateLimit({ windowMs: 15 * 60 * 1000, max: 180, standardHeaders: true, legacyHeaders: false });
const commentsWriteLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 60,  standardHeaders: true, legacyHeaders: false, message: { error: 'too_many_requests', message: 'You\'re posting too many comments. Please slow down.' } });
const commentsBurstLimiter = rateLimit({ windowMs: 2000,            max: 1,   standardHeaders: true, legacyHeaders: false, message: { error: 'too_many_requests', message: 'Please wait a moment before posting another comment.' } });
const balanceLimiter           = rateLimit({ windowMs: 15 * 60 * 1000, max: 60,  standardHeaders: true, legacyHeaders: false });
const stripeOnboardingLimiter  = rateLimit({ windowMs: 15 * 60 * 1000, max: 20,  standardHeaders: true, legacyHeaders: false });

// Pre-payment image validation — called before the payment sheet opens so the user
// is never charged for a non-food photo. Deletes the Cloudinary image if invalid.
router.post('/validate-image', reviewRequestLimiter, authenticateToken, async (req, res) => {
  const { image_url } = req.body;
  if (!image_url?.trim()) return res.status(400).json({ error: 'image_url is required' });

  const cleanImageUrl = image_url.trim();

  const { rows: aiLogRows } = await pool.query(
    `SELECT is_feed_eligible FROM ai_review_logs
     WHERE user_id = $1 AND image_url = $2 AND created_at > NOW() - INTERVAL '30 minutes'
     ORDER BY created_at DESC LIMIT 1`,
    [req.user.id, cleanImageUrl]
  );

  let isValid, reason;
  if (aiLogRows.length > 0) {
    isValid = aiLogRows[0].is_feed_eligible;
    reason = 'Image was flagged as non-food by a recent AI check.';
  } else {
    try {
      const validation = await validateFoodImage(cleanImageUrl);
      isValid = validation.isValidForFeed;
      reason = validation.reason;
    } catch (err) {
      if (err.code === 'GEMINI_QUOTA_EXCEEDED') {
        // Delete the uploaded image — we can't validate it, don't charge the user
        const publicId = getPublicIdFromUrl(cleanImageUrl);
        if (publicId && publicId.startsWith('posts/')) {
          await cloudinary.uploader.destroy(publicId).catch(() => {});
        }
        return res.status(503).json({ error: 'validation_unavailable', message: err.message });
      }
      throw err;
    }
  }

  if (!isValid) {
    const publicId = getPublicIdFromUrl(cleanImageUrl);
    if (publicId && publicId.startsWith('posts/')) {
      await cloudinary.uploader.destroy(publicId).catch(err => {
        console.error('[POST /chef/validate-image] Failed to delete orphaned Cloudinary image:', err.message);
      });
    }
    return res.status(400).json({ error: 'image_rejected', message: `Your photo doesn't appear to contain food. Please use a food photo.` });
  }

  res.json({ isValid: true });
});

// Atomically creates a post + review request in one transaction.
router.post('/submit-with-review', reviewRequestLimiter, authenticateToken, async (req, res) => {
  const { title, description, image_url, cook_time, difficulty, utensils, ingredients, instructions, context, chef_filter, payment_intent_id } = req.body;

  if (!title?.trim()) return res.status(400).json({ error: 'title is required' });
  if (!image_url?.trim()) return res.status(400).json({ error: 'image_url is required' });
  if (difficulty && !['Easy', 'Medium', 'Hard'].includes(difficulty)) {
    return res.status(400).json({ error: 'difficulty must be Easy, Medium, or Hard' });
  }

  // Verify the PaymentIntent with Stripe — guards against callers that skip the payment sheet.
  if (!payment_intent_id) {
    return res.status(402).json({ error: 'payment_required', message: 'A completed payment is required to submit a review request.' });
  }
  try {
    const pi = await stripe.paymentIntents.retrieve(payment_intent_id);
    if (pi.status !== 'succeeded') {
      return res.status(402).json({ error: 'payment_not_completed', message: 'Payment has not been completed.' });
    }
    if (pi.metadata?.userId !== req.user.id.toString()) {
      return res.status(403).json({ error: 'payment_mismatch', message: 'Payment does not belong to this account.' });
    }
    if (pi.metadata?.type !== 'chef_review') {
      return res.status(400).json({ error: 'invalid_payment_type', message: 'Invalid payment type.' });
    }
    
    // Prevent the same PaymentIntent from funding two review requests
    const { rows: usedRows } = await pool.query(
      'SELECT 1 FROM chef_review_requests WHERE payment_intent_id = $1',
      [payment_intent_id]
    );
    if (usedRows.length) {
      return res.status(409).json({ error: 'payment_already_used', message: 'This payment has already been used for a review request.' });
    }
  } catch (err) {
    if (err.type === 'StripeInvalidRequestError') {
      return res.status(400).json({ error: 'invalid_payment', message: 'Payment reference is invalid.' });
    }
    console.error('[POST /chef/submit-with-review] Stripe verify error:', err.message);
    return res.status(502).json({ error: 'payment_verification_failed', message: 'Could not verify payment. Please try again.' });
  }

  const cleanImageUrl = image_url.trim();

  // Per-user daily cap: 5 review requests per 24 hours.
  const { rows: chefDailyRows } = await pool.query(
    `SELECT COUNT(*) AS count FROM chef_review_requests
     WHERE requester_id = $1 AND created_at > NOW() - INTERVAL '24 hours'`,
    [req.user.id]
  );
  if (parseInt(chefDailyRows[0].count, 10) >= 5) {
    return res.status(429).json({ error: 'daily_chef_request_limit_exceeded', message: "You've reached the daily chef review request limit (5). Try again tomorrow." });
  }

  // Check if we already have an AI review validation for this image in the last 30 mins
  const { rows: aiLogRows } = await pool.query(
    `SELECT is_feed_eligible FROM ai_review_logs
     WHERE user_id = $1 AND image_url = $2 AND created_at > NOW() - INTERVAL '30 minutes'
     ORDER BY created_at DESC LIMIT 1`,
    [req.user.id, cleanImageUrl]
  );

  let isValid = true;
  let rejectReason = '';

  if (aiLogRows.length > 0) {
    isValid = aiLogRows[0].is_feed_eligible;
    rejectReason = 'Image was flagged as non-food by AI review.';
  } else {
    const validation = await validateFoodImage(cleanImageUrl);
    isValid = validation.isValidForFeed;
    rejectReason = validation.reason;
  }

  if (!isValid) {
    const publicId = getPublicIdFromUrl(cleanImageUrl);
    if (publicId && publicId.startsWith('posts/')) {
      await cloudinary.uploader.destroy(publicId).catch(err => {
        console.error('[POST /chef/submit-with-review] Failed to delete orphaned Cloudinary image:', err.message);
      });
    }
    return res.status(400).json({ error: `Image rejected: ${rejectReason}` });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Both inserts run inside the transaction — if fails, rollback.
    const { rows: postRows } = await client.query(`
      INSERT INTO posts (user_id, title, description, image_url, cook_time, difficulty, utensils, ingredients, instructions, is_global, is_seeded, chef_review_requested)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, false, false, true)
      RETURNING *
    `, [
      req.user.id,
      title.trim(),
      description?.trim() || null,
      cleanImageUrl,
      cook_time || null,
      difficulty || null,
      JSON.stringify(utensils || []),
      JSON.stringify(ingredients || []),
      instructions?.trim() || null,
    ]);

    const post = postRows[0];

    // RETURNING id needed for the notification payload sent to chefs.
    const { rows: reviewRows } = await client.query(
      'INSERT INTO chef_review_requests (requester_id, post_id, context, chef_filter, payment_intent_id) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [req.user.id, post.id, context?.trim() || null, chef_filter || 'All Chefs', payment_intent_id]
    );
    const reviewRequestId = reviewRows[0].id;

    await client.query('COMMIT');

    // Notifications sent after COMMIT — a failure here doesn't roll back the post.
    let chefIds = [];
    if (chef_filter === 'Following') {
      const following = await pool.query(
        'SELECT following_id FROM follows f JOIN users u ON f.following_id = u.id WHERE f.follower_id = $1 AND u.role = $2',
        [req.user.id, 'chef']
      );
      chefIds = following.rows.map(r => r.following_id);
    } else {
      const allChefs = await pool.query('SELECT id FROM users WHERE role = $1 AND id != $2', ['chef', req.user.id]);
      chefIds = allChefs.rows.map(r => r.id);
    }

    const requesterName = req.user.name || 'A user';
    // Dedup: if this requestId already has notifications (network retry), skip fan-out
    const existingFanOut = await pool.query(
      "SELECT 1 FROM notifications WHERE type = 'chef_review_request' AND data->>'requestId' = $1 LIMIT 1",
      [String(reviewRequestId)]
    );
    // chef_review_request always fires — not subject to user notification preferences.
    if (!existingFanOut.rows.length) {
      await Promise.all(chefIds.map(chefId => pool.query(
        'INSERT INTO notifications (user_id, type, title, subtitle, data, ref_post_id) VALUES ($1, $2, $3, $4, $5, $6)',
        [
          chefId,
          'chef_review_request',
          'Review Request',
          `${requesterName} wants your feedback on their ${post.title}`,
          JSON.stringify({ requestId: reviewRequestId, postId: post.id, requesterName, postTitle: post.title, postImage: post.image_url }),
          post.id,
        ]
      )));
    }

    res.status(201).json({
      post: {
        id: post.id,
        author: req.user.name,
        authorId: req.user.id,
        title: post.title,
        description: post.description,
        image: post.image_url,
        ingredients: post.ingredients,
        instructions: post.instructions,
        utensils: post.utensils,
        cookTime: post.cook_time,
        difficulty: post.difficulty,
        likes: 0,
        comments: 0,
        liked: false,
        saved: false,
        chefReviewRequested: true,
        createdAt: post.created_at,
      }
    });
  } catch (err) {
    await client.query('ROLLBACK');
    // Duplicate payment_intent_id: two requests raced past the pre-check — 409 not 500.
    if (err.code === '23505' && err.constraint?.includes('payment_intent_id')) {
      return res.status(409).json({ error: 'payment_already_used', message: 'This payment has already been used for a review request.' });
    }
    console.error('[POST /chef/submit-with-review]', err);
    res.status(500).json({ error: 'server error' });
  } finally {
    client.release();
  }
});

// User requests a review for a post
router.post('/review-request', reviewRequestLimiter, authenticateToken, async (req, res) => {
  try {
    const { post_id, context, chef_filter } = req.body;
    const requester_id = req.user.id;

    if (!post_id) return res.status(400).json({ error: 'post_id is required' });

    const postOwnership = await pool.query('SELECT user_id FROM posts WHERE id = $1', [post_id]);
    if (!postOwnership.rows.length) return res.status(404).json({ error: 'post not found' });
    if (postOwnership.rows[0].user_id !== requester_id) {
      return res.status(403).json({ error: 'cannot request a review on another user\'s post' });
    }

    const requestInsert = await pool.query(
      'INSERT INTO chef_review_requests (requester_id, post_id, context, chef_filter) VALUES ($1, $2, $3, $4) RETURNING *',
      [requester_id, post_id, context, chef_filter || 'All Chefs']
    );
    const reviewRequest = requestInsert.rows[0];

    let chefIds = [];
    if (chef_filter === 'Following') {
      const following = await pool.query(
        'SELECT following_id FROM follows f JOIN users u ON f.following_id = u.id WHERE f.follower_id = $1 AND u.role = $2', 
        [requester_id, 'chef']
      );
      chefIds = following.rows.map(r => r.following_id);
    } else {
      const allChefs = await pool.query('SELECT id FROM users WHERE role = $1 AND id != $2', ['chef', requester_id]);
      chefIds = allChefs.rows.map(r => r.id);
    }

    // Fetch title and image in one query so the notification includes the dish photo
    const postData = await pool.query('SELECT title, image_url FROM posts WHERE id = $1', [post_id]);
    const postTitle = postData.rows[0]?.title || 'a dish';
    const postImage = postData.rows[0]?.image_url || null;
    const requesterName = req.user.name || 'A user';

    // Dedup: skip fan-out if notifications already exist for this requestId (network retry)
    const existingFanOut2 = await pool.query(
      "SELECT 1 FROM notifications WHERE type = 'chef_review_request' AND data->>'requestId' = $1 LIMIT 1",
      [String(reviewRequest.id)]
    );
    // chef_review_request always fires — not subject to user notification preferences.
    if (!existingFanOut2.rows.length) {
      await Promise.all(chefIds.map(chefId => pool.query(
        'INSERT INTO notifications (user_id, type, title, subtitle, data, ref_post_id) VALUES ($1, $2, $3, $4, $5, $6)',
        [
          chefId,
          'chef_review_request',
          'Review Request',
          `${requesterName} wants your feedback on their ${postTitle}`,
          JSON.stringify({ requestId: reviewRequest.id, postId: post_id, requesterName, postTitle, postImage }),
          post_id,
        ]
      )));
    }

    res.status(201).json({ reviewRequest });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

// Get pending review requests (for Chefs)
router.get('/review-requests', feedLimiter, authenticateToken, requireChef, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT crr.*, p.title as post_title, u.name as requester_name 
       FROM chef_review_requests crr
       JOIN posts p ON crr.post_id = p.id
       JOIN users u ON crr.requester_id = u.id
       WHERE crr.status = 'pending' OR crr.claimed_by = $1
       ORDER BY crr.created_at DESC`,
      [req.user.id]
    );
    res.json({ requests: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

// Claim a review request
router.patch('/review-requests/:id/claim', reviewRequestLimiter, authenticateToken, requireChef, async (req, res) => {
  // Validate early — an invalid id string causes a PostgreSQL syntax error.
  const requestId = parseInt(req.params.id, 10);
  if (isNaN(requestId)) return res.status(400).json({ error: 'request id must be a valid integer' });
  try {
    const { rows } = await pool.query(
      `UPDATE chef_review_requests
       SET status = 'claimed', claimed_by = $1, updated_at = now()
       WHERE id = $2 AND status = 'pending'
       RETURNING *`,
      [req.user.id, requestId]
    );
    
    if (!rows.length) return res.status(404).json({ error: 'request not found or already claimed' });
    res.json({ request: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

// Submit a Chef Review
router.post('/reviews', reviewRequestLimiter, authenticateToken, requireChef, async (req, res) => {
  try {
    const { post_id, reaction_text, request_id } = req.body;
    const chef_id = req.user.id;

    if (!post_id || !reaction_text) return res.status(400).json({ error: 'post_id and reaction_text are required' });

    let reaction;
    try {
      const reactionInsert = await pool.query(
        'INSERT INTO chef_reactions (chef_id, post_id, reaction_text) VALUES ($1, $2, $3) RETURNING *',
        [chef_id, post_id, reaction_text]
      );
      reaction = reactionInsert.rows[0];
    } catch (insertErr) {
      if (insertErr.code === '23505') {
        if (request_id) {
          const existing = await pool.query(
            'SELECT * FROM chef_reactions WHERE chef_id = $1 AND post_id = $2',
            [chef_id, post_id]
          );
          if (existing.rows.length) {
            await pool.query(
              "UPDATE chef_review_requests SET status = 'completed', updated_at = now() WHERE id = $1 AND claimed_by = $2 AND post_id = $3",
              [request_id, chef_id, post_id]
            );
            // Send notification if the original INSERT succeeded but the response was lost
            const postAuthorRetry = await pool.query('SELECT user_id, title FROM posts WHERE id = $1', [post_id]);
            if (postAuthorRetry.rows.length && postAuthorRetry.rows[0].user_id !== chef_id) {
              const existingNotif = await pool.query(
                "SELECT 1 FROM notifications WHERE type = 'chef_review_received' AND data->>'reactionId' = $1 LIMIT 1",
                [String(existing.rows[0].id)]
              );
              if (!existingNotif.rows.length) {
                const chefName = req.user.name || 'A Chef';
                await pool.query(
                  'INSERT INTO notifications (user_id, type, title, subtitle, data, ref_post_id) VALUES ($1, $2, $3, $4, $5, $6)',
                  [postAuthorRetry.rows[0].user_id, 'chef_review_received', 'New Chef Review!',
                   `${chefName} reviewed your ${postAuthorRetry.rows[0].title}`,
                   JSON.stringify({ postId: post_id, reactionId: existing.rows[0].id, chefName }),
                   post_id]
                );
              }
            }
            return res.status(201).json({ reaction: existing.rows[0] });
          }
        }
        return res.status(409).json({ error: 'you already reviewed this post' });
      }
      if (insertErr.code === '23503') return res.status(404).json({ error: 'post not found' });
      throw insertErr;
    }

    if (request_id) {
      const { rowCount } = await pool.query(
        "UPDATE chef_review_requests SET status = 'completed', updated_at = now() WHERE id = $1 AND claimed_by = $2 AND post_id = $3 AND status != 'completed'",
        [request_id, chef_id, post_id]
      );
      if (rowCount > 0) {
        await pool.query(
          'UPDATE users SET earnings_balance = earnings_balance + 0.50 WHERE id = $1',
          [chef_id]
        );
        await pool.query(
          'INSERT INTO chef_earnings (chef_id, amount, type, ref_review_request_id) VALUES ($1, 0.50, $2, $3)',
          [chef_id, 'review_completion', request_id]
        );
      }
    }

    const postAuthorQuery = await pool.query('SELECT user_id, title FROM posts WHERE id = $1', [post_id]);
    if (postAuthorQuery.rows.length) {
      const { user_id: authorId, title: postTitle } = postAuthorQuery.rows[0];
      // Skip self-notification if the post author is the reviewing chef.
      if (authorId !== chef_id) {
        const chefName = req.user.name || 'A Chef';
        await pool.query(
          'INSERT INTO notifications (user_id, type, title, subtitle, data, ref_post_id) VALUES ($1, $2, $3, $4, $5, $6)',
          [authorId, 'chef_review_received', 'New Chef Review!',
           `${chefName} reviewed your ${postTitle}`,
           JSON.stringify({ postId: post_id, reactionId: reaction.id, chefName }),
           post_id]
        );
      }
    }

    res.status(201).json({ reaction });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

// Get Chef Feed (all chef reactions)
router.get('/feed', feedLimiter, authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT 
        cr.id,
        cr.reaction_text as reaction_text,
        cr.created_at,
        u.id as chef_id,
        u.name as chef_name,
        u.profile_photo as chef_photo,
        p.id as post_id,
        p.title as post_title,
        p.image_url as post_image,
        author.id as author_id,
        author.name as author_name,
        (SELECT COUNT(*) FROM post_likes WHERE chef_reaction_id = cr.id) as likes,
        (SELECT COUNT(*) FROM comments WHERE chef_reaction_id = cr.id) as comments,
        EXISTS(SELECT 1 FROM post_likes WHERE chef_reaction_id = cr.id AND user_id = $1) as liked,
        EXISTS(SELECT 1 FROM saved_posts WHERE post_id = p.id AND user_id = $1) as saved
      FROM chef_reactions cr
      JOIN users u ON cr.chef_id = u.id
      JOIN posts p ON cr.post_id = p.id
      JOIN users author ON p.user_id = author.id
      WHERE p.is_global = false
      ORDER BY cr.created_at DESC
      LIMIT 50
    `, [req.user.id]);

    const feedItems = rows.map(r => ({
      id: r.id,
      contentType: 'reaction',
      likes: parseInt(r.likes),
      comments: parseInt(r.comments),
      liked: r.liked,
      saved: r.saved,
      createdAt: r.created_at,
      chef: {
        id: r.chef_id,
        name: r.chef_name,
        avatar: r.chef_name ? r.chef_name.split(' ').map(n => n[0]).join('') : 'C',
        photo: r.chef_photo
      },
      reaction: {
        text: r.reaction_text,
        targetPostId: r.post_id,
        targetPost: {
          id: r.post_id,
          title: r.post_title,
          image: r.post_image
        },
        targetAuthor: {
          id: r.author_id,
          name: r.author_name
        }
      }
    }));

    res.json({ feedItems });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

// GET comments for a chef reaction
router.get('/:id/comments', commentsReadLimiter, authenticateToken, async (req, res) => {
  try {
    const reactionId = parseInt(req.params.id, 10);
    if (Number.isNaN(reactionId)) return res.status(400).json({ error: 'invalid reaction id' });

    const { rows } = await pool.query(
      `SELECT c.id, u.id as author_id, u.name as author, u.profile_photo, c.comment_text as text, c.created_at
       FROM comments c JOIN users u ON c.user_id = u.id
       WHERE c.chef_reaction_id = $1 ORDER BY c.created_at ASC`,
      [reactionId]
    );

    res.json({
      comments: rows.map(r => ({
        id: r.id,
        authorId: r.author_id,
        author: r.author,
        authorPhoto: r.profile_photo || null,
        initials: initials(r.author),
        text: r.text,
        timestamp: relativeTime(r.created_at),
      }))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

// POST a comment on a chef reaction
router.post('/:id/comments', commentsBurstLimiter, commentsWriteLimiter, authenticateToken, async (req, res) => {
  try {
    const reactionId = parseInt(req.params.id, 10);
    if (Number.isNaN(reactionId)) return res.status(400).json({ error: 'invalid reaction id' });
    const text = req.body.text?.trim();
    if (!text) return res.status(400).json({ error: 'text is required' });

    const rxCheck = await pool.query('SELECT chef_id FROM chef_reactions WHERE id = $1', [reactionId]);
    if (!rxCheck.rows.length) return res.status(404).json({ error: 'reaction not found' });

    const mod = moderateText(text);
    if (mod.flagged) {
      return res.status(400).json({
        error: 'comment_rejected',
        message: 'Your comment was not posted — it contains content that violates our community guidelines.',
      });
    }

    const { rows } = await pool.query(
      'INSERT INTO comments (chef_reaction_id, user_id, comment_text) VALUES ($1, $2, $3) RETURNING id, created_at',
      [reactionId, req.user.id, text]
    );
    const row = rows[0];
    const commenterName = req.user.name || 'Someone';

    const chefId = rxCheck.rows[0].chef_id;
    if (chefId !== req.user.id) {
      const commentCount = await pool.query('SELECT COUNT(*) AS count FROM comments WHERE chef_reaction_id = $1', [reactionId]);
      const count = parseInt(commentCount.rows[0].count, 10);
      if (await shouldNotify(chefId, 'comment_on_post', pool, count)) {
        await pool.query(
          'INSERT INTO notifications (user_id, type, title, subtitle, data, ref_chef_reaction_id) VALUES ($1, $2, $3, $4, $5, $6)',
          [chefId, 'comment_on_post', 'New Comment',
           `${commenterName} commented on your review`,
           JSON.stringify({ chefReactionId: reactionId, commentId: row.id, commenterId: req.user.id, commenterName, commentText: text }),
           reactionId]
        );
      }
    }

    res.status(201).json({
      comment: {
        id: row.id,
        authorId: req.user.id,
        author: commenterName,
        initials: initials(commenterName),
        text,
        timestamp: 'just now',
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

// GET /chef/balance — returns the authenticated chef's current earnings balance
router.get('/balance', balanceLimiter, authenticateToken, requireChef, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT earnings_balance FROM users WHERE id = $1',
      [req.user.id]
    );
    res.json({ balance: parseFloat(rows[0].earnings_balance || 0) });
  } catch (err) {
    console.error('[GET /chef/balance]', err);
    res.status(500).json({ error: 'server error' });
  }
});

// GET /chef/stripe/onboard-link — single-use links expire in ~5 min, always generated fresh.
router.get('/stripe/onboard-link', stripeOnboardingLimiter, authenticateToken, requireChef, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT stripe_account_id FROM users WHERE id = $1', [req.user.id]);
    let accountId = rows[0].stripe_account_id;

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        capabilities: { transfers: { requested: true } },
        metadata: { chef_id: req.user.id.toString() },
      });
      accountId = account.id;
      await pool.query('UPDATE users SET stripe_account_id = $1 WHERE id = $2', [accountId, req.user.id]);
    }

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.BACKEND_URL}/chef/stripe/onboard-link`,
      return_url: `${process.env.BACKEND_URL}/chef/stripe/onboard-return`,
      type: 'account_onboarding',
    });

    res.json({ url: accountLink.url });
  } catch (err) {
    console.error('[GET /chef/stripe/onboard-link]', err);
    res.status(500).json({ error: 'server error', message: 'Could not generate onboarding link.' });
  }
});

// GET /chef/stripe/onboard-status
router.get('/stripe/onboard-status', stripeOnboardingLimiter, authenticateToken, requireChef, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT stripe_account_id FROM users WHERE id = $1', [req.user.id]);
    const { stripe_account_id } = rows[0];

    if (!stripe_account_id) {
      return res.json({ onboarded: false, chargesEnabled: false, payoutsEnabled: false });
    }

    const account = await stripe.accounts.retrieve(stripe_account_id);
    res.json({
      onboarded: account.details_submitted,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
    });
  } catch (err) {
    console.error('[GET /chef/stripe/onboard-status]', err);
    res.status(500).json({ error: 'server error', message: 'Could not check onboarding status.' });
  }
});

// GET /chef/stripe/onboard-return — registered return_url, redirects to the deep-link.
router.get('/stripe/onboard-return', (req, res) => {
  res.redirect('chopandchat://stripe-onboard-return');
});

const withdrawLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5, standardHeaders: true, legacyHeaders: false });

// POST /chef/withdraw — withdraw available earnings via Stripe Transfer to connected account
router.post('/withdraw', withdrawLimiter, authenticateToken, requireChef, async (req, res) => {
  const withdrawAmount = parseFloat(req.body.amount);
  if (isNaN(withdrawAmount) || withdrawAmount < 1.00) {
    return res.status(400).json({ error: 'INSUFFICIENT_AMOUNT', message: 'Minimum withdrawal is 1.00 RON.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      'SELECT earnings_balance, stripe_account_id FROM users WHERE id = $1 FOR UPDATE',
      [req.user.id]
    );
    const { earnings_balance, stripe_account_id } = rows[0];
    const currentBalance = parseFloat(earnings_balance || 0);

    if (!stripe_account_id) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'NO_STRIPE_ACCOUNT', message: 'Complete Stripe payout setup before withdrawing.' });
    }
    if (currentBalance < 1.00) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'INSUFFICIENT_BALANCE', message: 'Minimum withdrawal is 1.00 RON.' });
    }
    if (withdrawAmount > currentBalance) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'INSUFFICIENT_BALANCE', message: 'Withdrawal amount exceeds available balance.' });
    }

    // Check platform's available Stripe balance first — charges take ~2 days to settle.
    try {
      const platformBalance = await stripe.balance.retrieve();
      const currency = (process.env.STRIPE_CURRENCY || 'usd').toLowerCase();
      const availableEntry = platformBalance.available.find(b => b.currency === currency);
      const availableCents = availableEntry ? availableEntry.amount : 0;
      const withdrawCents = Math.round(withdrawAmount * 100);
      if (availableCents < withdrawCents) {
        await client.query('ROLLBACK');
        return res.status(503).json({ error: 'PLATFORM_INSUFFICIENT_FUNDS', message: 'Withdrawals are temporarily unavailable. Please try again in 1-2 business days.' });
      }
    } catch (balanceErr) {
      console.error('[POST /chef/withdraw] Balance check error:', balanceErr.message);
      // Non-fatal: if we can't check, let the transfer attempt proceed and catch the error there
    }

    // Transfer to the chef's connected Stripe account.
    let stripeTransferId = null;
    try {
      const transfer = await stripe.transfers.create({
        amount: Math.round(withdrawAmount * 100),
        currency: process.env.STRIPE_CURRENCY || 'usd',
        destination: stripe_account_id,
        metadata: {
          chef_id: req.user.id.toString(),
          type: 'chef_earnings_withdrawal',
        },
      });
      stripeTransferId = transfer.id;
    } catch (stripeErr) {
      await client.query('ROLLBACK');
      console.error('[POST /chef/withdraw] Stripe error:', stripeErr.message);
      return res.status(502).json({ error: 'STRIPE_ERROR', message: 'Payout could not be processed. Please try again.' });
    }

    const newBalance = parseFloat(
      (await client.query(
        'UPDATE users SET earnings_balance = GREATEST(0, earnings_balance - $1) WHERE id = $2 RETURNING earnings_balance',
        [withdrawAmount, req.user.id]
      )).rows[0].earnings_balance
    );

    await client.query(
      'INSERT INTO chef_withdrawals (chef_id, amount, stripe_transfer_id) VALUES ($1, $2, $3)',
      [req.user.id, withdrawAmount, stripeTransferId]
    );

    await client.query('COMMIT');
    res.json({ message: 'Withdrawal successful.', new_balance: newBalance });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[POST /chef/withdraw]', err);
    res.status(500).json({ error: 'server error', message: 'Withdrawal failed. Please try again.' });
  } finally {
    client.release();
  }
});

module.exports = router;
