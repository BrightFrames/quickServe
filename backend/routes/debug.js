import express from 'express';
import jwt from 'jsonwebtoken';

const router = express.Router();

/**
 * Debug endpoint to test token validation
 * GET /api/debug/verify-token
 */
router.get('/verify-token', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(200).json({
        valid: false,
        error: 'No authorization header',
        help: 'Include header: Authorization: Bearer <your-token>'
      });
    }

    const parts = authHeader.split(' ');
    
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(200).json({
        valid: false,
        error: 'Invalid authorization header format',
        received: authHeader,
        expected: 'Bearer <token>'
      });
    }

    const token = parts[1];
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      return res.status(200).json({
        valid: true,
        decoded: {
          id: decoded.id,
          email: decoded.email,
          type: decoded.type,
          iat: new Date(decoded.iat * 1000).toISOString(),
          exp: new Date(decoded.exp * 1000).toISOString()
        },
        message: 'Token is valid'
      });
    } catch (jwtError) {
      return res.status(200).json({
        valid: false,
        error: jwtError.name,
        message: jwtError.message,
        help: jwtError.name === 'TokenExpiredError' 
          ? 'Token has expired. Please login again.'
          : 'Token is invalid. Please login again.'
      });
    }
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * Debug endpoint to check restaurant authentication
 * GET /api/debug/check-auth
 */
router.get('/check-auth', (req, res) => {
  const authHeader = req.headers.authorization;
  
  res.status(200).json({
    headers: {
      authorization: authHeader || 'not provided',
      'x-restaurant-slug': req.headers['x-restaurant-slug'] || 'not provided'
    },
    help: {
      restaurantLogin: 'POST /api/restaurant/login with { email, password }',
      useToken: 'Include header: Authorization: Bearer <token-from-login>',
      tokenType: 'Token must have type=restaurant for admin endpoints'
    }
  });
});

export default router;
