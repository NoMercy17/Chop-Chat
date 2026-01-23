require('dotenv').config();
const express = require('express');
const pool = require('./db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'change_me';

// Helper middleware
function authenticateToken(req, res, next) {
  const auth = req.headers['authorization'];
  if (!auth) return res.status(401).json({ error: 'missing token' });
  const token = auth.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'malformed token' });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'invalid token' });
    req.user = user;
    next();
  });
}

// Health check
app.get('/health', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT 1 AS ok');
    res.json({ ok: rows[0].ok === 1 });
  } catch (err) {
    console.error('DB health check failed', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});


app.post('/register', async (req, res) => {
  try {
    const { email, password, name, role } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });
    
    // Validate role field
    const userRole = role || 'user';
    if (!['user', 'chef'].includes(userRole)) {
      return res.status(400).json({ error: 'role must be "user" or "chef"' });
    }
    
    const lower = email.toLowerCase();
    const { rows } = await pool.query('SELECT id FROM users WHERE email = $1', [lower]);
    if (rows.length) return res.status(409).json({ error: 'user exists' });
    
    const hashed = await bcrypt.hash(password, 10);
    const insert = await pool.query(
      'INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role, created_at',
      [lower, hashed, name || null, userRole]
    );
    const user = insert.rows[0];
    console.log(`New ${user.role} registered:`, user.email);
    return res.status(201).json({ user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'server error' });
  }
});


app.post('/login', async (req, res) => {
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
    
    // Include role in JWT payload for authorization
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );
    
    console.log(` ${user.role} logged in:`, user.email);
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

// Get current user info 
app.get('/users/me', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, email, name, role, profile_photo, bio, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    
    if (!rows.length) {
      return res.status(404).json({ error: 'user not found' });
    }
    
    res.json({ user: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

// Update profile photo
app.patch('/users/profile-photo', authenticateToken, async (req, res) => {
  try {
    const { photo_url } = req.body;
    const userId = req.user.id;
    
    console.log('  Profile photo update request:');
    console.log('  User ID:', userId);
    console.log('  Photo URL:', photo_url);
    
    if (!photo_url) {
      return res.status(400).json({ error: 'photo_url is required' });
    }
    
    const query = `
      UPDATE users 
      SET profile_photo = $1 
      WHERE id = $2 
      RETURNING id, email, name, role, profile_photo, created_at
    `;
    
    const { rows } = await pool.query(query, [photo_url, userId]);
    
    console.log('  Updated rows:', rows.length);
    
    if (!rows.length) {
      console.log('  ❌ User not found');
      return res.status(404).json({ error: 'user not found' });
    }
    
    console.log('   Profile photo saved successfully');
    res.json({ user: rows[0] });
  } catch (err) {
    console.error('❌ Error updating profile photo:', err.message);
    console.error('  Full error:', err);
    res.status(500).json({ error: 'server error', details: err.message });
  }
});

// Update bio 
app.patch('/users/bio', authenticateToken, async (req, res) => {
  try {
    const { bio } = req.body;
    const userId = req.user.id;
    
    if (bio === undefined) {
      return res.status(400).json({ error: 'bio is required' });
    }
    
    const query = `
      UPDATE users 
      SET bio = $1 
      WHERE id = $2 
      RETURNING id, email, name, role, bio, profile_photo, created_at
    `;
    
    const { rows } = await pool.query(query, [bio, userId]);
    
    if (!rows.length) {
      return res.status(404).json({ error: 'user not found' });
    }
    
    res.json({ user: rows[0] });
  } catch (err) {
    console.error('Error updating bio:', err);
    res.status(500).json({ error: 'server error' });
  }
});

// Protected: list users 
// REASONING: Include role so frontend can display user type badges
app.get('/users', authenticateToken, async (req, res) => {
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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend listening on http://0.0.0.0:${PORT}`);
});