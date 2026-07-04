const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { authenticateToken } = require('../middleware');

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const pool = require('../db');

const CHEF_REVIEW_PRICE_CENTS = 200; // 2.00 RON (Stripe minimum for RON currency)

const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

// Creates a PaymentIntent for a chef review request.
// Returns the client_secret to the frontend so it can present the payment sheet.
// Daily cap is enforced HERE — before the user ever sees the payment sheet — so they
// cannot be charged and then rejected by submit-with-review for hitting the limit.
router.post('/create-intent', paymentLimiter, authenticateToken, async (req, res) => {
  try {
    // Check daily review request cap before creating a PaymentIntent.
    // If the user is at their limit, refuse now so they are never shown the payment sheet.
    const { rows: capRows } = await pool.query(
      `SELECT COUNT(*) AS count FROM chef_review_requests
       WHERE requester_id = $1 AND created_at > NOW() - INTERVAL '24 hours'`,
      [req.user.id]
    );
    if (parseInt(capRows[0].count, 10) >= 5) {
      return res.status(429).json({
        error: 'daily_chef_request_limit_exceeded',
        message: "You've reached the daily chef review request limit (5). Try again tomorrow.",
      });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: CHEF_REVIEW_PRICE_CENTS,
      currency: process.env.STRIPE_CURRENCY || 'usd',
      automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
      metadata: {
        userId: req.user.id.toString(),
        type: 'chef_review',
      },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error('[POST /payments/create-intent]', err);
    res.status(500).json({ error: 'payment initialization failed', message: 'Could not set up payment. Please try again.' });
  }
});

module.exports = router;
