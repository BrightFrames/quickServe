import jwt from 'jsonwebtoken';
import Restaurant from '../models/Restaurant.js';

/**
 * Middleware to authenticate restaurant JWT token and extract restaurantId
 * Adds restaurantId to req.restaurantId for use in routes
 * 
 * SECURITY: Validates token and ensures user can only access their restaurant's data
 */
export const authenticateRestaurant = async (req, res, next) => {
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
      restaurantId: decoded.restaurantId,
      restaurantCode: decoded.restaurantCode
    });
    
    // Store full user info in request
    req.user = decoded;
    
    // Handle admin tokens (role: 'admin' with restaurantCode)
    if (decoded.role === 'admin' && decoded.restaurantCode) {
      console.log('[AUTH] Admin token detected with restaurantCode:', decoded.restaurantCode);
      // Admin users need to be looked up via Restaurant model to get restaurantId
      const restaurant = await Restaurant.findOne({ where: { restaurantCode: decoded.restaurantCode } });
      
      if (!restaurant) {
        console.log('[AUTH] Restaurant not found for code:', decoded.restaurantCode);
        return res.status(403).json({ 
          message: 'Access denied',
          error: 'Restaurant not found for this admin account'
        });
      }
      
      req.restaurantId = restaurant.id;
      req.restaurantCode = decoded.restaurantCode;
      req.userRole = 'admin';
      console.log('[AUTH] ✓ Admin authenticated for restaurant:', restaurant.id);
    }
    // Allow restaurant, kitchen, captain, and reception users
    else if (decoded.type === 'restaurant') {
      // Restaurant owner - use their ID as restaurantId
      req.restaurantId = decoded.id;
      req.restaurantEmail = decoded.email;
      req.userRole = 'admin'; // Restaurant owner is admin
    } else if (decoded.role && ['kitchen', 'cook', 'captain', 'reception', 'cashier', 'viewer'].includes(decoded.role)) {
      // Staff users - use their restaurantId from token
      if (!decoded.restaurantId) {
        console.log('[AUTH] Staff user missing restaurantId in token');
        return res.status(403).json({ 
          message: 'Access denied',
          error: 'Invalid token: missing restaurant association'
        });
      }
      
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
    
    console.log('[AUTH] ✓ Restaurant authenticated:', req.restaurantId, 'Role:', req.userRole);
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
      
      req.user = decoded;
      
      if (decoded.type === 'restaurant') {
        req.restaurantId = decoded.id;
        req.restaurantEmail = decoded.email;
      } else if (decoded.restaurantId) {
        req.restaurantId = decoded.restaurantId;
        req.userId = decoded.id;
        req.userRole = decoded.role;
      }
    }
    
    next();
  } catch (error) {
    // Token invalid but continue anyway since it's optional
    next();
  }
};
