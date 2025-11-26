import jwt from 'jsonwebtoken';

/**
 * Middleware to authenticate restaurant JWT token and extract restaurantId
 * Adds restaurantId to req.restaurantId for use in routes
 */
export const authenticateRestaurant = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.type !== 'restaurant') {
      return res.status(403).json({ message: 'Invalid token type' });
    }

    // Add restaurantId to request for use in routes
    req.restaurantId = decoded.id;
    req.restaurantEmail = decoded.email;
    
    next();
  } catch (error) {
    console.error('[AUTH MIDDLEWARE] Error:', error.message);
    return res.status(401).json({ message: 'Invalid or expired token' });
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
