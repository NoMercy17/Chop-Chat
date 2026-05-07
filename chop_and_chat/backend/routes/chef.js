const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken, requireChef } = require('../middleware');

function relativeTime(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function initials(name) {
  const parts = (name || '').trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (name || '').substring(0, 2).toUpperCase();
}

// User requests a review for a post
router.post('/review-request', authenticateToken, async (req, res) => {
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
      const allChefs = await pool.query('SELECT id FROM users WHERE role = $1', ['chef']);
      chefIds = allChefs.rows.map(r => r.id);
    }

    const postData = await pool.query('SELECT title FROM posts WHERE id = $1', [post_id]);
    const postTitle = postData.rows[0]?.title || 'a dish';
    const requesterName = req.user.name || 'A user';

    for (const chefId of chefIds) {
      await pool.query(
        'INSERT INTO notifications (user_id, type, title, subtitle, data) VALUES ($1, $2, $3, $4, $5)',
        [
          chefId, 
          'chef_review_request', 
          'Review Request', 
          `${requesterName} wants your feedback on their ${postTitle}`,
          JSON.stringify({ requestId: reviewRequest.id, postId: post_id, requesterName, postTitle })
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
  try {
    const { rows } = await pool.query(
      `UPDATE chef_review_requests 
       SET status = 'claimed', claimed_by = $1, updated_at = now() 
       WHERE id = $2 AND status = 'pending' 
       RETURNING *`,
      [req.user.id, req.params.id]
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
      if (insertErr.code === '23505') return res.status(409).json({ error: 'you already reviewed this post' });
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
router.get('/feed', authenticateToken, async (req, res) => {
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
router.get('/:id/comments', authenticateToken, async (req, res) => {
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
router.post('/:id/comments', authenticateToken, async (req, res) => {
  try {
    const reactionId = parseInt(req.params.id, 10);
    if (Number.isNaN(reactionId)) return res.status(400).json({ error: 'invalid reaction id' });
    const text = req.body.text?.trim();
    if (!text) return res.status(400).json({ error: 'text is required' });

    const rxCheck = await pool.query('SELECT chef_id FROM chef_reactions WHERE id = $1', [reactionId]);
    if (!rxCheck.rows.length) return res.status(404).json({ error: 'reaction not found' });

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
