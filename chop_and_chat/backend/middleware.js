const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'change_me';

// REASONING: Reusable middleware to protect routes with JWT
function authenticateToken(req, res, next) {
  const auth = req.headers['authorization'];
  if (!auth) return res.status(401).json({ error: 'missing token' });
  const token = auth.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'malformed token' });
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'invalid token' });
    req.user = user;
    next();
  });
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
