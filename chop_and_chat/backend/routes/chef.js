const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const pool = require('../db');
const { authenticateToken, requireChef } = require('../middleware');
const { validateFoodImage } = require('../services/gemini');
const { moderateText } = require('../services/moderation');
const cloudinary = require('../services/cloudinary');
const { relativeTime, initials, getPublicIdFromUrl } = require('../utils/helpers');

const reviewRequestLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10,  standardHeaders: true, legacyHeaders: false });
const feedLimiter          = rateLimit({ windowMs: 15 * 60 * 1000, max: 120, standardHeaders: true, legacyHeaders: false });
const commentsReadLimiter  = rateLimit({ windowMs: 15 * 60 * 1000, max: 180, standardHeaders: true, legacyHeaders: false });
const commentsWriteLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 60,  standardHeaders: true, legacyHeaders: false, message: { error: 'too_many_requests', message: 'You\'re posting too many comments. Please slow down.' } });
const commentsBurstLimiter = rateLimit({ windowMs: 2000,            max: 1,   standardHeaders: true, legacyHeaders: false, message: { error: 'too_many_requests', message: 'Please wait a moment before posting another comment.' } });

// Creates a post + chef review request atomically in a single DB transaction.
// This replaces the old two-call flow (POST /posts then POST /chef/review-request) where
// a failure after post creation would leave an orphaned post with no review request row.
router.post('/submit-with-review', reviewRequestLimiter, authenticateToken, async (req, res) => {
  const { title, description, image_url, cook_time, difficulty, utensils, ingredients, instructions, context, chef_filter } = req.body;

  if (!title?.trim()) return res.status(400).json({ error: 'title is required' });
  if (!image_url?.trim()) return res.status(400).json({ error: 'image_url is required' });
  if (difficulty && !['Easy', 'Medium', 'Hard'].includes(difficulty)) {
    return res.status(400).json({ error: 'difficulty must be Easy, Medium, or Hard' });
  }

  const cleanImageUrl = image_url.trim();

  // Per-user daily chef review request cap — each request triggers a Gemini validation call
  const { rows: chefDailyRows } = await pool.query(
    `SELECT COUNT(*) AS count FROM chef_review_requests
     WHERE requester_id = $1 AND created_at > NOW() - INTERVAL '24 hours'`,
    [req.user.id]
  );
  if (parseInt(chefDailyRows[0].count, 10) >= 3) {
    return res.status(429).json({ error: 'daily_chef_request_limit_exceeded', message: "You've reached the daily chef review request limit (3). Try again tomorrow." });
  }

  const validation = await validateFoodImage(cleanImageUrl);
  if (!validation.isValidForFeed) {
    const publicId = getPublicIdFromUrl(cleanImageUrl);
    if (publicId && publicId.startsWith('posts/')) {
      await cloudinary.uploader.destroy(publicId).catch(err => {
        console.error('[POST /chef/submit-with-review] Failed to delete orphaned Cloudinary image:', err.message);
      });
    }
    return res.status(400).json({ error: `Image rejected: ${validation.reason}` });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Both inserts run inside the transaction — if either fails, ROLLBACK undoes both.
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

    // RETURNING id is required so we can include requestId in the notification data,
    // which the frontend needs to claim the request without a separate lookup.
    const { rows: reviewRows } = await client.query(
      'INSERT INTO chef_review_requests (requester_id, post_id, context, chef_filter) VALUES ($1, $2, $3, $4) RETURNING id',
      [req.user.id, post.id, context?.trim() || null, chef_filter || 'All Chefs']
    );
    const reviewRequestId = reviewRows[0].id;

    await client.query('COMMIT');

    // Notifications are sent outside the transaction — they're non-critical and
    // a notification failure should not roll back the post + review request.
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
    for (const chefId of chefIds) {
      await pool.query(
        'INSERT INTO notifications (user_id, type, title, subtitle, data) VALUES ($1, $2, $3, $4, $5)',
        [
          chefId,
          'chef_review_request',
          'Review Request',
          `${requesterName} wants your feedback on their ${post.title}`,
          // requestId and postImage are included so the chef's notification UI can show
          // the dish image and claim the request without extra lookups.
          JSON.stringify({ requestId: reviewRequestId, postId: post.id, requesterName, postTitle: post.title, postImage: post.image_url })
        ]
      );
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

    for (const chefId of chefIds) {
      await pool.query(
        'INSERT INTO notifications (user_id, type, title, subtitle, data) VALUES ($1, $2, $3, $4, $5)',
        [
          chefId,
          'chef_review_request',
          'Review Request',
          `${requesterName} wants your feedback on their ${postTitle}`,
          JSON.stringify({ requestId: reviewRequest.id, postId: post_id, requesterName, postTitle, postImage })
        ]
      );
    }

    res.status(201).json({ reviewRequest });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

// Get pending review requests (for Chefs)
router.get('/review-requests', authenticateToken, requireChef, async (req, res) => {
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
router.patch('/review-requests/:id/claim', authenticateToken, requireChef, async (req, res) => {
  // Parse and validate before touching the DB — passing the raw param string when it is
  // 'undefined' causes PostgreSQL to throw "invalid input syntax for type integer".
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
router.post('/reviews', authenticateToken, requireChef, async (req, res) => {
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
        // Reaction already exists — this happens when the claim succeeded and the reaction
        // was saved, but the status update to 'completed' failed. Make the endpoint idempotent:
        // if a request_id is provided, find the existing reaction, mark the request complete,
        // and return success so the chef isn't stuck in a broken state.
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
            return res.status(201).json({ reaction: existing.rows[0] });
          }
        }
        return res.status(409).json({ error: 'you already reviewed this post' });
      }
      if (insertErr.code === '23503') return res.status(404).json({ error: 'post not found' });
      throw insertErr;
    }

    if (request_id) {
      // Also pin to post_id so a chef can't accidentally mark an unrelated claimed request completed.
      await pool.query(
        "UPDATE chef_review_requests SET status = 'completed', updated_at = now() WHERE id = $1 AND claimed_by = $2 AND post_id = $3",
        [request_id, chef_id, post_id]
      );
    }

    const postAuthorQuery = await pool.query('SELECT user_id, title FROM posts WHERE id = $1', [post_id]);
    if (postAuthorQuery.rows.length) {
      const { user_id: authorId, title: postTitle } = postAuthorQuery.rows[0];
      const chefName = req.user.name || 'A Chef';

      await pool.query(
        'INSERT INTO notifications (user_id, type, title, subtitle, data) VALUES ($1, $2, $3, $4, $5)',
        [
          authorId, 
          'chef_review_received', 
          'New Chef Review!', 
          `${chefName} reviewed your ${postTitle}`,
          JSON.stringify({ postId: post_id, reactionId: reaction.id, chefName })
        ]
      );
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
      `SELECT c.id, u.id as author_id, u.name as author, c.comment_text as text, c.created_at
       FROM comments c JOIN users u ON c.user_id = u.id
       WHERE c.chef_reaction_id = $1 ORDER BY c.created_at ASC`,
      [reactionId]
    );

    res.json({
      comments: rows.map(r => ({
        id: r.id,
        authorId: r.author_id,
        author: r.author,
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
      await pool.query(
        'INSERT INTO notifications (user_id, type, title, subtitle, data) VALUES ($1, $2, $3, $4, $5)',
        [chefId, 'comment_on_post', 'New Comment',
         `${commenterName} commented on your review`,
         JSON.stringify({ chefReactionId: reactionId, commentId: row.id, commenterId: req.user.id, commenterName, commentText: text })]
      );
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

module.exports = router;
