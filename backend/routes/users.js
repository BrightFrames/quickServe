import express from 'express'
import bcrypt from 'bcryptjs'
import { Op } from 'sequelize'
import User from '../models/User.js'
import Restaurant from '../models/Restaurant.js'
import { authenticateRestaurant } from '../middleware/auth.js'
import { enforceTenantIsolation, requireRole } from '../middleware/rbac.js'

const router = express.Router()

// ============================
// PROTECTED ROUTES - Require Authentication
// ============================
// All routes below require valid JWT token
router.use(authenticateRestaurant);

// Get all kitchen users - CRITICAL: Tenant isolated
router.get('/kitchen', enforceTenantIsolation, async (req, res) => {
  try {
    // SECURITY: Only fetch users from authenticated restaurant
    const users = await User.findAll({
      where: {
        restaurantId: req.restaurantId, // Enforced by middleware
        role: {
          [Op.in]: ['kitchen', 'cook'],
        },
      },
      attributes: { exclude: ['password'] },
      order: [['username', 'ASC']],
    })
    
    console.log(`[USERS] Retrieved ${users.length} kitchen users for restaurant ${req.restaurantId}`);
    res.json(users)
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
})

// ============================
// Create Kitchen User (AUTHENTICATED - Admin Only)
// ============================
/**
 * POST /api/users/kitchen
 * 
 * Creates a kitchen staff user for the authenticated restaurant.
 * Requires admin role and valid JWT with restaurantId.
 * 
 * Request Body:
 * {
 *   "username": "kitchen_john",
 *   "password": "securePass123"
 * }
 */
router.post('/kitchen', enforceTenantIsolation, requireRole(['admin']), async (req, res) => {
  console.log('[USERS] Create kitchen user request (authenticated)');
  
  try {
    const { username, password } = req.body;

    // Validate required fields
    if (!username || !password) {
      console.log('[USERS] ✗ Missing required fields');
      return res.status(400).json({ 
        message: 'Username and password are required' 
      });
    }

    // Validate password length
    if (password.length < 6) {
      console.log('[USERS] ✗ Password too short');
      return res.status(400).json({ 
        message: 'Password must be at least 6 characters long' 
      });
    }

    // Check if username already exists in this restaurant
    const existingUser = await User.findOne({ 
      where: { 
        username,
        restaurantId: req.restaurantId // From JWT token
      } 
    });
    
    if (existingUser) {
      console.log(`[USERS] ✗ Username already exists: ${username}`);
      return res.status(400).json({ 
        message: 'Username already exists for this restaurant' 
      });
    }

    // Create kitchen user - password auto-hashed by Sequelize beforeCreate hook
    const user = await User.create({
      username,
      password, // Sequelize hook will hash this automatically
      role: 'kitchen',
      restaurantId: req.restaurantId, // From authenticated JWT
      isOnline: false,
      lastActive: new Date()
    });

    console.log(`[USERS] ✓ Kitchen user created: ${username} for restaurant ${req.restaurantId}`);

    // Return user without password
    const userResponse = user.toJSON();
    delete userResponse.password;

    res.status(201).json({
      message: 'Kitchen user created successfully',
      user: userResponse
    });
    
  } catch (error) {
    console.error('[USERS] Error creating kitchen user:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// ============================
// Create Captain User (AUTHENTICATED - Admin Only)
// ============================
/**
 * POST /api/users/captain
 * 
 * Creates a captain staff user for the authenticated restaurant.
 * Requires admin role and valid JWT with restaurantId.
 * 
 * Request Body:
 * {
 *   "username": "captain_sarah",
 *   "password": "securePass456"
 * }
 */
router.post('/captain', enforceTenantIsolation, requireRole(['admin']), async (req, res) => {
  console.log('[USERS] Create captain user request (authenticated)');
  
  try {
    const { username, password } = req.body;

    // Validate required fields
    if (!username || !password) {
      console.log('[USERS] ✗ Missing required fields');
      return res.status(400).json({ 
        message: 'Username and password are required' 
      });
    }

    // Validate password length
    if (password.length < 6) {
      console.log('[USERS] ✗ Password too short');
      return res.status(400).json({ 
        message: 'Password must be at least 6 characters long' 
      });
    }

    // Check if username already exists in this restaurant
    const existingUser = await User.findOne({ 
      where: { 
        username,
        restaurantId: req.restaurantId // From JWT token
      } 
    });
    
    if (existingUser) {
      console.log(`[USERS] ✗ Username already exists: ${username}`);
      return res.status(400).json({ 
        message: 'Username already exists for this restaurant' 
      });
    }

    // Create captain user - password auto-hashed by Sequelize beforeCreate hook
    const user = await User.create({
      username,
      password, // Sequelize hook will hash this automatically
      role: 'captain',
      restaurantId: req.restaurantId, // From authenticated JWT
      isOnline: false,
      lastActive: new Date()
    });

    console.log(`[USERS] ✓ Captain user created: ${username} for restaurant ${req.restaurantId}`);

    // Return user without password
    const userResponse = user.toJSON();
    delete userResponse.password;

    res.status(201).json({
      message: 'Captain user created successfully',
      user: userResponse
    });
    
  } catch (error) {
    console.error('[USERS] Error creating captain user:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
})

// Update user
router.put('/:id', enforceTenantIsolation, requireRole(['admin']), async (req, res) => {
  try {
    const { username, password, role } = req.body
    const updateData = { username, role }

    if (password) {
      const salt = await bcrypt.genSalt(10)
      updateData.password = await bcrypt.hash(password, salt)
    }

    const user = await User.findOne({ 
      where: { 
        id: req.params.id,
        restaurantId: req.restaurantId 
      } 
    });
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    await user.update(updateData)
    
    const userResponse = user.toJSON()
    delete userResponse.password

    res.json(userResponse)
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
})

// Delete user
router.delete('/:id', enforceTenantIsolation, requireRole(['admin']), async (req, res) => {
  try {
    const user = await User.findOne({ 
      where: { 
        id: req.params.id,
        restaurantId: req.restaurantId 
      } 
    });
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }
    await user.destroy()
    res.json({ message: 'User deleted successfully' })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
})

export default router
