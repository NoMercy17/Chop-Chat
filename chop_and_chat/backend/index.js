require('dotenv').config();

// Fail fast if required env vars are missing — never start with insecure defaults.
const REQUIRED_ENV = [
  'JWT_SECRET', 'DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME',
  'GEMINI_API_KEY',
  'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET',
  'STRIPE_SECRET_KEY',
];
const missing = REQUIRED_ENV.filter(k => !process.env[k]);
if (missing.length) {
  console.error(`FATAL: missing required env vars: ${missing.join(', ')}`);
  process.exit(1);
}


const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const pool = require('./db');

// Import Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const notificationRoutes = require('./routes/notifications');
const chefRoutes = require('./routes/chef');
const postRoutes = require('./routes/posts');
const aiRoutes = require('./routes/ai');
const paymentRoutes = require('./routes/payments');

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

// Throttle auth endpoints to slow down brute-force / credential-stuffing.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'too many auth attempts, try again later' },
});

const PORT = process.env.PORT || 4000;

// Health check

app.get('/health', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT 1 AS ok');
    res.json({ ok: rows[0].ok === 1 });
  } catch (err) {
    console.error('DB health check failed', err);
    res.status(500).json({ ok: false, error: 'server error' });
  }
});

// Mount Routes — rate limiter scoped to auth endpoints only
app.use('/login', authLimiter);
app.use('/register', authLimiter);
app.use('/resend-verification', authLimiter);
app.use('/verify-email', authLimiter);
app.use('/', authRoutes);
app.use('/users', userRoutes);
app.use('/notifications', notificationRoutes);
app.use('/chef', chefRoutes);
app.use('/posts', postRoutes);
app.use('/ai', aiRoutes);
app.use('/payments', paymentRoutes);

async function purgeExpiredUnverifiedAccounts() {
  try {
    const { rowCount } = await pool.query(
      `DELETE FROM users
       WHERE email_verified = FALSE
         AND verification_token_expires_at < NOW() - INTERVAL '24 hours'`
    );
    if (rowCount > 0) {
      console.log(`[cleanup] Purged ${rowCount} expired unverified account(s)`);
    }
  } catch (err) {
    console.error('[cleanup] Failed to purge expired unverified accounts:', err);
  }
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend listening on http://0.0.0.0:${PORT}`);
  purgeExpiredUnverifiedAccounts();
  setInterval(purgeExpiredUnverifiedAccounts, 24 * 60 * 60 * 1000);
});
