const User = require('../models/User');

/**
 * Middleware to verify admin authentication
 * Expects userId in request body or query params
 * For production, consider using JWT tokens instead
 */
const requireAdmin = async (req, res, next) => {
  try {
    const userId = req.body.adminUserId || req.query.adminUserId || req.headers['x-admin-user-id'];
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'Admin authentication required',
        errorType: 'unauthorized' 
      });
    }

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Admin user not found',
        errorType: 'user_not_found' 
      });
    }

    if (user.role !== 'ADMIN') {
      return res.status(403).json({ 
        success: false, 
        message: 'Admin privileges required',
        errorType: 'forbidden' 
      });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({ 
        success: false, 
        message: 'Admin account is not active',
        errorType: 'account_inactive' 
      });
    }

    // Attach admin user to request for use in route handlers
    req.adminUser = user;
    next();
  } catch (err) {
    console.error('[requireAdmin] Error:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Authentication error',
      error: err.message 
    });
  }
};

/**
 * Middleware to verify any authenticated user (not necessarily admin)
 */
const requireAuth = async (req, res, next) => {
  try {
    const userId = req.body.userId || req.query.userId || req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required',
        errorType: 'unauthorized' 
      });
    }

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found',
        errorType: 'user_not_found' 
      });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({ 
        success: false, 
        message: 'Account is not active',
        errorType: 'account_inactive' 
      });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('[requireAuth] Error:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Authentication error',
      error: err.message 
    });
  }
};

module.exports = {
  requireAdmin,
  requireAuth
};



