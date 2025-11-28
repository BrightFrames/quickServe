import express from 'express'
import bcrypt from 'bcryptjs'
import { Op } from 'sequelize'
import { tenantMiddleware, requireTenant } from '../middleware/tenantMiddleware.js'

const router = express.Router()

// Apply tenant middleware to all routes
router.use(tenantMiddleware);

// Get all kitchen users
router.get('/kitchen', requireTenant, async (req, res) => {
  try {
    const { User: TenantUser } = req.tenant.models;
    
    const users = await TenantUser.findAll({
      where: {
        role: {
          [Op.in]: ['kitchen', 'cook'],
        },
      },
      attributes: { exclude: ['password'] },
      order: [['username', 'ASC']],
    })
    
    console.log(`[USERS] Retrieved ${users.length} kitchen users for ${req.tenant.slug}`);
    res.json(users)
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
})

// Create kitchen user
router.post('/kitchen', requireTenant, async (req, res) => {
  try {
    const { User: TenantUser } = req.tenant.models;
    const { username, password, role } = req.body

    // Check if user already exists
    const existingUser = await TenantUser.findOne({ where: { username } })
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' })
    }

    // Hash password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    const user = await TenantUser.create({
      username,
      password: hashedPassword,
      role: role || 'kitchen',
    })

    const userResponse = user.toJSON()
    delete userResponse.password

    console.log(`[USERS] ✓ Kitchen user created for ${req.tenant.slug}: ${username}`);
    res.status(201).json(userResponse)
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
})

// Update user
router.put('/:id', requireTenant, async (req, res) => {
  try {
    const { User: TenantUser } = req.tenant.models;
    const { username, password, role } = req.body
    const updateData = { username, role }

    if (password) {
      const salt = await bcrypt.genSalt(10)
      updateData.password = await bcrypt.hash(password, salt)
    }

    const user = await TenantUser.findByPk(req.params.id)
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
router.delete('/:id', requireTenant, async (req, res) => {
  try {
    const { User: TenantUser } = req.tenant.models;
    
    const user = await TenantUser.findByPk(req.params.id)
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
