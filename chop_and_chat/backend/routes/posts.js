const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware');

const commentsReadLimiter  = rateLimit({ windowMs: 15 * 60 * 1000, max: 180, standardHeaders: true, legacyHeaders: false });
const commentsWriteLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 40, standardHeaders: true, legacyHeaders: false });

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

// GET all posts for the community feed (EXCLUDES global reference recipes)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT 
        p.*,
        u.name as author,
        u.id as author_id,
        (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) as likes,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments,
        EXISTS(SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = $1) as liked,
        EXISTS(SELECT 1 FROM saved_posts WHERE post_id = p.id AND user_id = $1) as saved
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.is_global = false
      ORDER BY p.created_at DESC
      LIMIT 50
    `, [req.user.id]);

    const posts = rows.map(r => ({
      id: r.id,
      author: r.author,
      authorId: r.author_id,
      title: r.title,
      description: r.description,
      image: r.image_url,
      ingredients: r.ingredients,
      instructions: r.instructions,
      utensils: r.utensils,
      cookTime: r.cook_time,
      difficulty: r.difficulty,
      likes: parseInt(r.likes),
      comments: parseInt(r.comments),
      liked: r.liked,
      saved: r.saved,
      createdAt: r.created_at
    }));

    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

// SEARCH recipes (INCLUDES global reference recipes + user's own recipes)
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { query, utensils } = req.query;
    const user_id = req.user.id;

    let sql = `
      SELECT 
        p.*,
        u.name as author,
        u.id as author_id,
        (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) as likes,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments,
        EXISTS(SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = $1) as liked,
        EXISTS(SELECT 1 FROM saved_posts WHERE post_id = p.id AND user_id = $1) as saved
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE (p.is_global = true OR p.user_id = $1)
    `;
    const params = [user_id];

    if (query) {
      params.push(`%${query}%`);
      sql += ` AND (p.title ILIKE $${params.length} OR p.description ILIKE $${params.length} OR p.ingredients::text ILIKE $${params.length})`;
    }

    if (utensils) {
      const utensilList = Array.isArray(utensils) ? utensils : utensils.split(',');
      params.push(utensilList);
      sql += ` AND p.utensils ?| $${params.length}`;
    }

    sql += ` ORDER BY p.is_global DESC, p.created_at DESC LIMIT 100`;

    const { rows } = await pool.query(sql, params);

    const results = rows.map(r => ({
      id: r.id,
      author: r.author,
      authorId: r.author_id,
      title: r.title,
      description: r.description,
      image: r.image_url,
      ingredients: r.ingredients,
      instructions: r.instructions,
      utensils: r.utensils,
      cookTime: r.cook_time,
      difficulty: r.difficulty,
      likes: parseInt(r.likes),
      comments: parseInt(r.comments),
      liked: r.liked,
      saved: r.saved,
      isGlobal: r.is_global
    }));

    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

// GET posts saved by the current user (Favorites)
router.get('/saved', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { rows } = await pool.query(`
      SELECT
        p.id, p.title, p.description, p.image_url, p.ingredients, p.instructions,
        p.utensils, p.cook_time, p.difficulty, p.is_global, p.created_at,
        u.name  AS author,
        u.id    AS author_id,
        (SELECT COUNT(*) FROM post_likes  WHERE post_id = p.id)                  AS likes,
        (SELECT COUNT(*) FROM comments    WHERE post_id = p.id)                  AS comments,
        EXISTS (SELECT 1 FROM post_likes  WHERE post_id = p.id AND user_id = $1) AS liked,
        sp.created_at AS saved_at
      FROM saved_posts sp
      JOIN posts p ON p.id = sp.post_id
      JOIN users u ON u.id = p.user_id
      WHERE sp.user_id = $1
      ORDER BY sp.created_at DESC
    `, [userId]);

    res.json(rows.map(r => ({
      id: r.id,
      author: r.author,
      authorId: r.author_id,
      title: r.title,
      description: r.description,
      image: r.image_url,
      ingredients: r.ingredients,
      instructions: r.instructions,
      utensils: r.utensils,
      cookTime: r.cook_time,
      difficulty: r.difficulty,
      likes: parseInt(r.likes),
      comments: parseInt(r.comments),
      liked: r.liked,
      saved: true,
    })));
  } catch (err) {
    console.error('[GET /saved]', err);
    res.status(500).json({ error: 'server error' });
  }
});

// GET single post detail
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT 
        p.*,
        u.name as author,
        u.id as author_id,
        (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) as likes,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments,
        EXISTS(SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = $1) as liked,
        EXISTS(SELECT 1 FROM saved_posts WHERE post_id = p.id AND user_id = $1) as saved
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = $2
    `, [req.user.id, req.params.id]);

    if (!rows.length) return res.status(404).json({ error: 'post not found' });
    
    const post = rows[0];
    res.json({
      id: post.id,
      author: post.author,
      authorId: post.author_id,
      title: post.title,
      description: post.description,
      image: post.image_url,
      ingredients: post.ingredients,
      instructions: post.instructions,
      utensils: post.utensils,
      cookTime: post.cook_time,
      difficulty: post.difficulty,
      likes: parseInt(post.likes),
      comments: parseInt(post.comments),
      liked: post.liked,
      saved: post.saved,
      isGlobal: post.is_global
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

// Like a post or chef reaction
router.post('/like', authenticateToken, async (req, res) => {
  try {
    const { post_id, chef_reaction_id } = req.body;
    const user_id = req.user.id;

    if (!post_id && !chef_reaction_id) {
      return res.status(400).json({ error: 'post_id or chef_reaction_id required' });
    }

    const existing = await pool.query(
      'SELECT id FROM post_likes WHERE user_id = $1 AND (post_id = $2 OR chef_reaction_id = $3)',
      [user_id, post_id || null, chef_reaction_id || null]
    );

    if (existing.rows.length) {
      await pool.query('DELETE FROM post_likes WHERE id = $1', [existing.rows[0].id]);
      return res.json({ liked: false });
    } else {
      await pool.query(
        'INSERT INTO post_likes (user_id, post_id, chef_reaction_id) VALUES ($1, $2, $3)',
        [user_id, post_id || null, chef_reaction_id || null]
      );
      // Notify content owner (skip if liking own content)
      const likerName = req.user.name || 'Someone';
      if (post_id) {
        const postData = await pool.query('SELECT user_id, title FROM posts WHERE id = $1', [post_id]);
        if (postData.rows.length && postData.rows[0].user_id !== user_id) {
          await pool.query(
            'INSERT INTO notifications (user_id, type, title, subtitle, data) VALUES ($1, $2, $3, $4, $5)',
            [postData.rows[0].user_id, 'post_likes', 'Post Liked',
             `${likerName} liked your ${postData.rows[0].title}`,
             JSON.stringify({ postId: post_id, likerId: user_id, likerName })]
          );
        }
      } else if (chef_reaction_id) {
        const rxData = await pool.query('SELECT chef_id FROM chef_reactions WHERE id = $1', [chef_reaction_id]);
        if (rxData.rows.length && rxData.rows[0].chef_id !== user_id) {
          await pool.query(
            'INSERT INTO notifications (user_id, type, title, subtitle, data) VALUES ($1, $2, $3, $4, $5)',
            [rxData.rows[0].chef_id, 'post_likes', 'Post Liked',
             `${likerName} liked your review`,
             JSON.stringify({ chefReactionId: chef_reaction_id, likerId: user_id, likerName })]
          );
        }
      }
      return res.status(201).json({ liked: true });
    }
  } catch (err) {
    if (err.code === '23503') return res.status(401).json({ error: 'invalid token' });
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

// Save a post to favorites
router.post('/save', authenticateToken, async (req, res) => {
  try {
    const { post_id } = req.body;
    const user_id = req.user.id;

    if (!post_id) return res.status(400).json({ error: 'post_id required' });

    const existing = await pool.query(
      'SELECT id FROM saved_posts WHERE user_id = $1 AND post_id = $2',
      [user_id, post_id]
    );

    if (existing.rows.length) {
      await pool.query('DELETE FROM saved_posts WHERE id = $1', [existing.rows[0].id]);
      return res.json({ saved: false });
    } else {
      await pool.query(
        'INSERT INTO saved_posts (user_id, post_id) VALUES ($1, $2)',
        [user_id, post_id]
      );
      return res.status(201).json({ saved: true });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

// GET comments for a post
router.get('/:id/comments', commentsReadLimiter, authenticateToken, async (req, res) => {
  try {
    const postId = parseInt(req.params.id, 10);
    if (Number.isNaN(postId)) return res.status(400).json({ error: 'invalid post id' });

    const { rows } = await pool.query(
      `SELECT c.id, u.id as author_id, u.name as author, c.comment_text as text, c.created_at
       FROM comments c JOIN users u ON c.user_id = u.id
       WHERE c.post_id = $1 ORDER BY c.created_at ASC`,
      [postId]
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

// POST a comment on a post
router.post('/:id/comments', commentsWriteLimiter, authenticateToken, async (req, res) => {
  try {
    const postId = parseInt(req.params.id, 10);
    if (Number.isNaN(postId)) return res.status(400).json({ error: 'invalid post id' });
    const text = req.body.text?.trim();
    if (!text) return res.status(400).json({ error: 'text is required' });

    const postCheck = await pool.query('SELECT user_id, title FROM posts WHERE id = $1', [postId]);
    if (!postCheck.rows.length) return res.status(404).json({ error: 'post not found' });

    const { rows } = await pool.query(
      'INSERT INTO comments (post_id, user_id, comment_text) VALUES ($1, $2, $3) RETURNING id, created_at',
      [postId, req.user.id, text]
    );
    const row = rows[0];
    const commenterName = req.user.name || 'Someone';

    const { user_id: authorId, title: postTitle } = postCheck.rows[0];
    if (authorId !== req.user.id) {
      await pool.query(
        'INSERT INTO notifications (user_id, type, title, subtitle, data) VALUES ($1, $2, $3, $4, $5)',
        [authorId, 'comment_on_post', 'New Comment',
         `${commenterName} commented on your ${postTitle}`,
         JSON.stringify({ postId, commentId: row.id, commenterId: req.user.id, commenterName, commentText: text })]
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
