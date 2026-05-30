const express = require('express');
const router = express.Router();
const pool = require('../db');
const rateLimit = require('express-rate-limit');

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const stripeWebhookLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true, legacyHeaders: false });

// POST /webhooks/stripe
// Registered with express.raw() in index.js (before express.json()).
// Stripe signature verification requires the raw, unparsed request body.
router.post('/stripe', stripeWebhookLimiter, async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('[webhook] Signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const pi = event.data.object;
      const userId = pi.metadata?.userId ? parseInt(pi.metadata.userId, 10) : null;
      try {
        await pool.query(
          `INSERT INTO payment_transactions (payment_intent_id, user_id, amount_cents, currency, status)
           VALUES ($1, $2, $3, $4, 'succeeded')
           ON CONFLICT (payment_intent_id) DO UPDATE SET status = 'succeeded'`,
          [pi.id, userId, pi.amount, pi.currency]
        );
      } catch (err) {
        console.error(`[webhook] DB error for payment_intent.succeeded ${pi.id}:`, err);
        // Return 500 so Stripe retries — the upsert is idempotent and safe to replay
        return res.status(500).json({ error: 'db_error' });
      }
      console.log(`[webhook] payment_intent.succeeded — ${pi.id}, user: ${userId}, amount: ${pi.amount} ${pi.currency}`);
      break;
    }

    case 'account.updated': {
      const account = event.data.object;
      if (account.details_submitted) {
        console.log(`[webhook] Connect account ${account.id} — details_submitted=true, charges_enabled=${account.charges_enabled}`);
      }
      break;
    }

    case 'transfer.created': {
      const transfer = event.data.object;
      console.log(`[webhook] transfer.created — ${transfer.id}, destination: ${transfer.destination}, amount: ${transfer.amount} ${transfer.currency}`);
      break;
    }

    default:
      break;
  }

  res.json({ received: true });
});

module.exports = router;
