const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware');

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
      return res.status(201).json({ liked: true });
    }
  } catch (err) {
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

module.exports = router;
