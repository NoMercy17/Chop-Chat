const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware');
const rateLimit = require('express-rate-limit');

const notificationsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

// Get all notifications for current user
router.get('/', authenticateToken, notificationsLimiter, async (req, res) => {
  try {
    const query = `
      SELECT
        n.*,
        CASE
          -- Guard against non-numeric requestId values (e.g. null or 'undefined') before
          -- casting to int; a bare ::int cast throws "invalid input syntax for type integer".
          WHEN n.type = 'chef_review_request' AND (n.data->>'requestId') ~ '^[0-9]+$' THEN (
            SELECT claimed_by FROM chef_review_requests WHERE id = (n.data->>'requestId')::int
          )
          ELSE NULL
        END as claimed_by_id,
        CASE
          WHEN n.type = 'chef_review_request' AND (n.data->>'requestId') ~ '^[0-9]+$' THEN (
            SELECT status FROM chef_review_requests WHERE id = (n.data->>'requestId')::int
          )
          ELSE NULL
        END as request_status
      FROM notifications n
      WHERE n.user_id = $1
      ORDER BY n.created_at DESC
      LIMIT 50
    `;

    const { rows } = await pool.query(query, [req.user.id]);

    const enrichedNotifications = rows.map(n => {
      const data = { ...n.data };
      if (n.claimed_by_id) data.claimedBy = n.claimed_by_id;
      if (n.request_status) data.requestStatus = n.request_status;

      return { ...n, data };
    });

    res.json({ notifications: enrichedNotifications });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

const PREF_TYPES = ['new_follower', 'post_likes', 'comment_on_post'];

// Get notification preferences for the current user
// Must be declared before /:id routes so Express doesn't match "preferences" as an id
router.get('/preferences', authenticateToken, notificationsLimiter, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT type, enabled, threshold FROM notification_preferences WHERE user_id = $1',
      [req.user.id]
    );
    const prefs = {};
    for (const type of PREF_TYPES) {
      const row = rows.find(r => r.type === type);
      prefs[type] = row ? { enabled: row.enabled, threshold: row.threshold } : { enabled: true, threshold: 1 };
    }
    res.json({ preferences: prefs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

// Upsert a single notification preference
// Must be declared before /:id routes so Express doesn't match "preferences" as an id
router.patch('/preferences', authenticateToken, notificationsLimiter, async (req, res) => {
  try {
    const { type, enabled, threshold } = req.body;
    if (!PREF_TYPES.includes(type)) {
      return res.status(400).json({ error: 'invalid notification type' });
    }
    if (enabled === undefined || enabled === null) {
      return res.status(400).json({ error: 'enabled is required' });
    }
    const t = parseInt(threshold, 10);
    if (threshold !== undefined && ![1, 5, 10].includes(t)) {
      return res.status(400).json({ error: 'threshold must be 1, 5, or 10' });
    }
    await pool.query(
      `INSERT INTO notification_preferences (user_id, type, enabled, threshold)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, type) DO UPDATE SET enabled = $3, threshold = $4`,
      [req.user.id, type, Boolean(enabled), threshold !== undefined ? t : 1]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

// Mark notification as read
router.patch('/:id/read', authenticateToken, notificationsLimiter, async (req, res) => {
  const notifId = parseInt(req.params.id, 10);
  if (Number.isNaN(notifId)) return res.status(400).json({ error: 'invalid notification id' });
  try {
    const { rows } = await pool.query(
      'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2 RETURNING *',
      [notifId, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'notification not found' });
    res.json({ notification: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

// Delete a notification
router.delete('/:id', authenticateToken, notificationsLimiter, async (req, res) => {
  const notifId = parseInt(req.params.id, 10);
  if (Number.isNaN(notifId)) return res.status(400).json({ error: 'invalid notification id' });
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2',
      [notifId, req.user.id]
    );
    if (!rowCount) return res.status(404).json({ error: 'notification not found' });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

module.exports = router;
