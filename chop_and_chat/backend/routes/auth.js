const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { JWT_SECRET } = require('../middleware');

router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });
    
    const userRole = role || 'user';
    if (!['user', 'chef'].includes(userRole)) {
      return res.status(400).json({ error: 'role must be "user" or "chef"' });
    }

    // Bio is immutable and derived from role at signup; there is no PATCH /users/bio.
    const bio = userRole === 'chef' ? 'Professional Chef' : 'Food Enthusiast';

    const lower = email.toLowerCase();
    const { rows } = await pool.query('SELECT id FROM users WHERE email = $1', [lower]);
    if (rows.length) return res.status(409).json({ error: 'user exists' });

    const hashed = await bcrypt.hash(password, 10);
    const insert = await pool.query(
      'INSERT INTO users (email, password, name, role, bio) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, name, role, bio, created_at',
      [lower, hashed, name || null, userRole, bio]
    );
    const user = insert.rows[0];
    return res.status(201).json({ user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });
    
    const lower = email.toLowerCase();
    const { rows } = await pool.query(
      'SELECT id, email, password, name, role, profile_photo FROM users WHERE email = $1', 
      [lower]
    );
    const user = rows[0];
    if (!user) return res.status(401).json({ error: 'invalid credentials' });
    
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'invalid credentials' });
    
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    return res.json({ 
      token, 
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name,
        role: user.role,
        profile_photo: user.profile_photo 
      } 
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'server error' });
  }
});

module.exports = router;
