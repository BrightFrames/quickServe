import jwt from 'jsonwebtoken';

/**
 * Middleware to authenticate restaurant JWT token and extract restaurantId
 * Adds restaurantId to req.restaurantId for use in routes
 */
export const authenticateRestaurant = (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      console.log('[AUTH] No authorization header provided');
      return res.status(401).json({ 
        message: 'Authentication required',
        error: 'No authorization header provided'
      });
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      console.log('[AUTH] No token in authorization header');
      return res.status(401).json({ 
        message: 'Authentication required',
        error: 'Invalid authorization header format. Expected: Bearer <token>'
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    console.log('[AUTH] Token decoded:', { 
      id: decoded.id, 
      username: decoded.username,
      role: decoded.role,
      email: decoded.email, 
      type: decoded.type,
      restaurantId: decoded.restaurantId
    });
    
    // Allow restaurant, kitchen, captain, and reception users
    if (decoded.type === 'restaurant') {
      // Restaurant owner - use their ID as restaurantId
      req.restaurantId = decoded.id;
      req.restaurantEmail = decoded.email;
    } else if (decoded.role && ['kitchen', 'captain', 'reception'].includes(decoded.role)) {
      // Staff users - use their restaurantId from token
      req.restaurantId = decoded.restaurantId;
      req.userId = decoded.id;
      req.userRole = decoded.role;
      req.username = decoded.username;
    } else {
      console.log('[AUTH] Invalid token type/role:', decoded.type, decoded.role);
      return res.status(403).json({ 
        message: 'Access denied',
        error: 'This endpoint requires restaurant or staff authentication'
      });
    }
    
    console.log('[AUTH] ✓ Restaurant authenticated:', req.restaurantId);
    next();
  } catch (error) {
    console.error('[AUTH MIDDLEWARE] Error:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: 'Invalid token',
        error: 'Token is malformed or invalid'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Token expired',
        error: 'Please login again'
      });
    }
    
    return res.status(401).json({ 
      message: 'Authentication failed',
      error: error.message
    });
  }
};

/**
 * Optional authentication - adds restaurantId if token present but doesn't require it
 */
export const optionalRestaurantAuth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.type === 'restaurant') {
        req.restaurantId = decoded.id;
        req.restaurantEmail = decoded.email;
      }
    }
    
    next();
  } catch (error) {
    // Token invalid but continue anyway since it's optional
    next();
  }
};
