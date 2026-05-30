const express = require('express');
const router = express.Router();
const pool = require('../db');

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// POST /webhooks/stripe
// Registered with express.raw() in index.js (before express.json()).
// Stripe signature verification requires the raw, unparsed request body.
router.post('/stripe', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('[webhook] Signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const pi = event.data.object;
        const userId = pi.metadata?.userId ? parseInt(pi.metadata.userId, 10) : null;
        await pool.query(
          `INSERT INTO payment_transactions (payment_intent_id, user_id, amount_cents, currency, status)
           VALUES ($1, $2, $3, $4, 'succeeded')
           ON CONFLICT (payment_intent_id) DO UPDATE SET status = 'succeeded'`,
          [pi.id, userId, pi.amount, pi.currency]
        );
        console.log(`[webhook] payment_intent.succeeded — ${pi.id}, user: ${userId}, amount: ${pi.amount} ${pi.currency}`);
        break;
      }

      case 'account.updated': {
        const account = event.data.object;
        // authoritative signal that a Connect Express account completed onboarding
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
  } catch (err) {
    console.error(`[webhook] Handler error for ${event.type}:`, err);
    // Return 200 so Stripe doesn't retry — the error is logged for manual review
    return res.status(200).json({ received: true, error: err.message });
  }

  res.json({ received: true });
});

module.exports = router;
