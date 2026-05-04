require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./db');

// Import Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const notificationRoutes = require('./routes/notifications');
const chefRoutes = require('./routes/chef');
const postRoutes = require('./routes/posts');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;

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

// Mount Routes
app.use('/', authRoutes);
app.use('/users', userRoutes);
app.use('/notifications', notificationRoutes);
app.use('/chef', chefRoutes);
app.use('/posts', postRoutes);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend listening on http://0.0.0.0:${PORT}`);
});
