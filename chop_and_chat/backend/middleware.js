const jwt = require('jsonwebtoken');
const pool = require('./db');
const JWT_SECRET = process.env.JWT_SECRET;

// Verifies the JWT signature AND confirms the user still exists in the DB.
// Returning 'invalid token' on a missing user reuses the string api.js already
// checks for, which fires the auth_error_logout event and clears the local session.
async function authenticateToken(req, res, next) {
  const auth = req.headers['authorization'];
  if (!auth) return res.status(401).json({ error: 'missing token' });
  const token = auth.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'malformed token' });

  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch {
    return res.status(403).json({ error: 'invalid token' });
  }

  try {
    const { rows } = await pool.query('SELECT id FROM users WHERE id = $1', [payload.id]);
    if (!rows.length) return res.status(401).json({ error: 'invalid token' });
  } catch (err) {
    console.error('[authenticateToken] DB check failed:', err.message);
    return res.status(500).json({ error: 'server error' });
  }

  req.user = payload;
  next();
}

// REASONING: Reusable middleware to protect chef-only endpoints
function requireChef(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'not authenticated' });
  }
  
  if (req.user.role !== 'chef') {
    return res.status(403).json({ error: 'chef access required' });
  }
  
  next();
}

// REASONING: Check if user is accessing their own resources
function requireOwnership(resourceUserIdKey = 'userId') {
  return async (req, res, next) => {
    const resourceUserId = req.params[resourceUserIdKey] || req.body[resourceUserIdKey];
    
    if (!resourceUserId) {
      return res.status(400).json({ error: 'missing user identifier' });
    }
    
    if (parseInt(resourceUserId) !== req.user.id) {
      return res.status(403).json({ error: 'not authorized to access this resource' });
    }
    
    next();
  };
}

module.exports = {
  authenticateToken,
  requireChef,
  requireOwnership,
  JWT_SECRET
};
