const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const pool = require('../db');
const { JWT_SECRET } = require('../middleware');
const { sendVerificationLinkEmail } = require('../services/emailService');

const BACKEND_URL = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 4000}`;

const verifyEmailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many verification attempts from this IP, please try again later.',
});

const resendVerificationLimiter = rateLimit({
  windowMs: 2 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again shortly.' },
});

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many registration attempts from this IP. Please try again later.' },
});

// POST /register
// Creates user with email_verified=false, sends a verification link. No JWT issued yet.
router.post('/register', registerLimiter, async (req, res) => {
  try {
    const { email, password, name, role } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'name, email and password required' });
    }

    const userRole = role || 'user';
    if (!['user', 'chef'].includes(userRole)) {
      return res.status(400).json({ error: 'role must be "user" or "chef"' });
    }

    const lower = email.toLowerCase();

    const { rows: existing } = await pool.query('SELECT id, email_verified FROM users WHERE email = $1', [lower]);
    if (existing.length && existing[0].email_verified) {
      return res.status(409).json({ error: 'EMAIL_TAKEN', message: 'An account with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const bio = userRole === 'chef' ? 'Professional Chef' : 'Food Enthusiast';

    if (existing.length) {
      // Unverified stale record — overwrite with fresh registration data
      await pool.query(
        `UPDATE users SET name = $1, password = $2, role = $3, bio = $4,
         email_verified = FALSE, verification_token = $5, verification_token_expires_at = $6
         WHERE id = $7`,
        [name, hashedPassword, userRole, bio, token, expiresAt, existing[0].id]
      );
    } else {
      await pool.query(
        `INSERT INTO users (email, password, name, role, bio, email_verified, verification_token, verification_token_expires_at)
         VALUES ($1, $2, $3, $4, $5, FALSE, $6, $7)`,
        [lower, hashedPassword, name, userRole, bio, token, expiresAt]
      );
    }

    const verificationUrl = `${BACKEND_URL}/verify-email?token=${token}`;
    await sendVerificationLinkEmail({ to: lower, name, verificationUrl });

    return res.status(201).json({ message: 'Registration successful. Please verify your email.' });
  } catch (err) {
    console.error('[auth] register error:', err);
    if (err.message?.includes('Email service not configured')) {
      return res.status(503).json({ error: 'Email service is not configured on this server' });
    }
    return res.status(500).json({ error: 'server error' });
  }
});

// GET /verify-email?token=<token>
// Opened in browser — validates the token and returns an HTML response.
router.get('/verify-email', verifyEmailLimiter, async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).send(buildErrorPage('Missing verification token.'));
    }

    const { rows } = await pool.query(
      'SELECT id, email_verified, verification_token_expires_at FROM users WHERE verification_token = $1',
      [token]
    );
    const user = rows[0];

    if (!user) {
      return res.status(400).send(buildErrorPage('This verification link is invalid or has already been used.'));
    }

    if (user.email_verified) {
      return res.send(buildSuccessPage('Your email is already verified. You can now log in to Chop & Chat.'));
    }

    if (new Date() > new Date(user.verification_token_expires_at)) {
      return res.status(400).send(buildErrorPage('This link has expired. Open the Chop & Chat app and tap "Resend verification email" to get a fresh link.'));
    }

    await pool.query(
      'UPDATE users SET email_verified = TRUE, verification_token = NULL, verification_token_expires_at = NULL WHERE id = $1',
      [user.id]
    );

    return res.send(buildSuccessPage('Email verified! You can now log in to Chop & Chat.'));
  } catch (err) {
    console.error('[auth] verify-email error:', err);
    return res.status(500).send(buildErrorPage('Something went wrong. Please try again later.'));
  }
});

// POST /login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });

    const lower = email.toLowerCase();
    const { rows } = await pool.query(
      'SELECT id, email, password, name, role, profile_photo, email_verified, earnings_balance FROM users WHERE email = $1',
      [lower]
    );
    const user = rows[0];
    if (!user) return res.status(401).json({ error: 'invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'invalid credentials' });

    if (!user.email_verified) {
      return res.status(403).json({
        error: 'EMAIL_NOT_VERIFIED',
        message: 'Please verify your email before logging in.',
      });
    }

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
        profile_photo: user.profile_photo,
        email_verified: true,
        ...(user.role === 'chef' && { earnings_balance: parseFloat(user.earnings_balance || 0) }),
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'server error' });
  }
});

// POST /resend-verification
// Generates a new verification link. Rate-limited: one resend per 2 minutes.
router.post('/resend-verification', resendVerificationLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'email required' });
    }

    const lower = email.toLowerCase();
    const { rows } = await pool.query(
      'SELECT id, name, email_verified, verification_token_expires_at FROM users WHERE email = $1',
      [lower]
    );
    const user = rows[0];

    // Generic response regardless — prevents email enumeration
    if (!user || user.email_verified) {
      return res.json({ message: 'If that email is registered and unverified, a new link has been sent.' });
    }

    if (user.verification_token_expires_at) {
      // Token issued_at ≈ expires_at − 2h; reject if issued less than 2 minutes ago
      const issuedAt = new Date(user.verification_token_expires_at).getTime() - 2 * 60 * 60 * 1000;
      const timeSinceIssue = Date.now() - issuedAt;
      if (timeSinceIssue < 2 * 60 * 1000) {
        return res.status(429).json({ error: 'Please wait before requesting another verification email.' });
      }
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);

    await pool.query(
      'UPDATE users SET verification_token = $1, verification_token_expires_at = $2 WHERE id = $3',
      [token, expiresAt, user.id]
    );

    const verificationUrl = `${BACKEND_URL}/verify-email?token=${token}`;
    await sendVerificationLinkEmail({ to: lower, name: user.name, verificationUrl });

    return res.json({ message: 'If that email is registered and unverified, a new link has been sent.' });
  } catch (err) {
    console.error('[auth] resend-verification error:', err);
    if (err.message?.includes('Email service not configured')) {
      return res.status(503).json({ error: 'Email service is not configured on this server' });
    }
    return res.status(500).json({ error: 'server error' });
  }
});

function buildSuccessPage(message) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Verified — Chop &amp; Chat</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 20px; background: #FAF7F2; font-family: 'Georgia', serif;
           display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .card { background: #FFFFFF; border-radius: 16px; padding: 48px 40px; max-width: 480px;
            width: 100%; text-align: center; box-shadow: 0 4px 24px rgba(0,0,0,0.06); }
    .icon { font-size: 52px; margin-bottom: 16px; }
    .badge { color: #F5C97A; font-size: 12px; font-weight: 700; letter-spacing: 2px;
             text-transform: uppercase; margin-bottom: 16px; }
    h1 { color: #1C1C1C; font-size: 24px; font-weight: 700; margin: 0 0 16px; }
    p { color: #6B6052; font-size: 16px; line-height: 1.6; margin: 0; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">✓</div>
    <div class="badge">Chop &amp; Chat</div>
    <h1>Email Verified!</h1>
    <p>${message}</p>
  </div>
</body>
</html>`;
}

function buildErrorPage(message) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verification Failed — Chop &amp; Chat</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 20px; background: #FAF7F2; font-family: 'Georgia', serif;
           display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .card { background: #FFFFFF; border-radius: 16px; padding: 48px 40px; max-width: 480px;
            width: 100%; text-align: center; box-shadow: 0 4px 24px rgba(0,0,0,0.06); }
    .icon { font-size: 52px; margin-bottom: 16px; }
    .badge { color: #F5C97A; font-size: 12px; font-weight: 700; letter-spacing: 2px;
             text-transform: uppercase; margin-bottom: 16px; }
    h1 { color: #1C1C1C; font-size: 24px; font-weight: 700; margin: 0 0 16px; }
    p { color: #6B6052; font-size: 16px; line-height: 1.6; margin: 0 0 20px; }
    .hint { color: #9E8E7A; font-size: 14px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">✗</div>
    <div class="badge">Chop &amp; Chat</div>
    <h1>Verification Failed</h1>
    <p>${message}</p>
    <p class="hint">Open the Chop &amp; Chat app and tap "Resend verification email" to get a fresh link.</p>
  </div>
</body>
</html>`;
}

module.exports = router;
