
// REASONING: Reusable middleware to protect chef-only endpoints
// - Checks if authenticated user has role='chef'
// - Returns 403 Forbidden if user is not a chef
// - Use this on endpoints like POST /chef/reactions

function requireChef(req, res, next) {
  // Assumes authenticateToken middleware has already run
  if (!req.user) {
    return res.status(401).json({ error: 'not authenticated' });
  }
  
  if (req.user.role !== 'chef') {
    return res.status(403).json({ error: 'chef access required' });
  }
  
  next();
}

// REASONING: Check if user is accessing their own resources
// - Prevents users from modifying other users' posts/profiles
// - userId parameter can be from req.params.userId or req.body.userId
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
  requireChef,
  requireOwnership
};
