const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { authenticateToken } = require('../middleware');

const CHEF_REVIEW_PRICE_CENTS = 50; // $0.50

const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

// Creates a PaymentIntent for a chef review request.
// Returns the client_secret to the frontend so it can present the payment sheet.
router.post('/create-intent', paymentLimiter, authenticateToken, async (req, res) => {
  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: CHEF_REVIEW_PRICE_CENTS,
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
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
