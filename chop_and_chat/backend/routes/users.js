const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../db');
const { authenticateToken } = require('../middleware');

// Get current user info 
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, email, name, role, profile_photo, bio, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    
    if (!rows.length) return res.status(404).json({ error: 'user not found' });
    res.json({ user: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

// Update profile photo
router.patch('/profile-photo', authenticateToken, async (req, res) => {
  try {
    const { photo_url } = req.body;
    if (!photo_url) return res.status(400).json({ error: 'photo_url is required' });
    
    const { rows } = await pool.query(
      'UPDATE users SET profile_photo = $1 WHERE id = $2 RETURNING id, email, name, role, profile_photo, created_at',
      [photo_url, req.user.id]
    );
    
    if (!rows.length) return res.status(404).json({ error: 'user not found' });
    res.json({ user: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

// Change password (verifies current password, then hashes and stores the new one)
router.patch('/password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'currentPassword and newPassword are required' });
    }

    const { rows } = await pool.query(
      'SELECT id, password FROM users WHERE id = $1',
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'user not found' });

    const ok = await bcrypt.compare(currentPassword, rows[0].password);
    if (!ok) return res.status(401).json({ error: 'current password is incorrect' });

    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashed, req.user.id]);
    res.json({ message: 'password changed successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

// List users
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, email, name, role, profile_photo, created_at FROM users ORDER BY id DESC LIMIT 100'
    );
    res.json({ users: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

// Follow a user
router.post('/:id/follow', authenticateToken, async (req, res) => {
  try {
    const targetId = parseInt(req.params.id, 10);
    if (Number.isNaN(targetId)) return res.status(400).json({ error: 'invalid user id' });
    if (targetId === req.user.id) return res.status(400).json({ error: 'cannot follow yourself' });

    const { rows } = await pool.query(
      'INSERT INTO follows (follower_id, following_id) VALUES ($1, $2) RETURNING id, follower_id, following_id, created_at',
      [req.user.id, targetId]
    );
    res.status(201).json({ follow: rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'already following' });
    if (err.code === '23514') return res.status(400).json({ error: 'cannot follow yourself' });
    if (err.code === '23503') return res.status(404).json({ error: 'user not found' });
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

// Unfollow a user
router.delete('/:id/follow', authenticateToken, async (req, res) => {
  try {
    const targetId = parseInt(req.params.id, 10);
    if (Number.isNaN(targetId)) return res.status(400).json({ error: 'invalid user id' });

    const { rowCount } = await pool.query(
      'DELETE FROM follows WHERE follower_id = $1 AND following_id = $2',
      [req.user.id, targetId]
    );
    if (!rowCount) return res.status(404).json({ error: 'not following' });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

// Followers (people who follow :id)
router.get('/:id/followers', authenticateToken, async (req, res) => {
  try {
    const targetId = parseInt(req.params.id, 10);
    if (Number.isNaN(targetId)) return res.status(400).json({ error: 'invalid user id' });

    const { rows } = await pool.query(
      `SELECT u.id, u.name, u.profile_photo, u.role
       FROM users u
       JOIN follows f ON u.id = f.follower_id
       WHERE f.following_id = $1
       ORDER BY f.created_at DESC`,
      [targetId]
    );
    res.json({ followers: rows, count: rows.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

// Following (people :id follows)
router.get('/:id/following', authenticateToken, async (req, res) => {
  try {
    const targetId = parseInt(req.params.id, 10);
    if (Number.isNaN(targetId)) return res.status(400).json({ error: 'invalid user id' });

    const { rows } = await pool.query(
      `SELECT u.id, u.name, u.profile_photo, u.role
       FROM users u
       JOIN follows f ON u.id = f.following_id
       WHERE f.follower_id = $1
       ORDER BY f.created_at DESC`,
      [targetId]
    );
    res.json({ following: rows, count: rows.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

// Does the current user follow :id?
router.get('/:id/is-following', authenticateToken, async (req, res) => {
  try {
    const targetId = parseInt(req.params.id, 10);
    if (Number.isNaN(targetId)) return res.status(400).json({ error: 'invalid user id' });

    const { rows } = await pool.query(
      'SELECT 1 FROM follows WHERE follower_id = $1 AND following_id = $2',
      [req.user.id, targetId]
    );
    res.json({ isFollowing: rows.length > 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

module.exports = router;
