const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware');

// Get all notifications for current user
router.get('/', authenticateToken, async (req, res) => {
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

// Mark notification as read
router.patch('/:id/read', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2 RETURNING *',
      [req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'notification not found' });
    res.json({ notification: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

module.exports = router;
