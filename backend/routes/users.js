import express from 'express'
import bcrypt from 'bcryptjs'
import { Op } from 'sequelize'
import User from '../models/User.js'

const router = express.Router()

// Get all kitchen users
router.get('/kitchen', async (req, res) => {
  try {
    const users = await User.findAll({
      where: {
        role: {
          [Op.in]: ['kitchen', 'cook'],
        },
      },
      attributes: { exclude: ['password'] },
      order: [['username', 'ASC']],
    })
    res.json(users)
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
})

// Create kitchen user
router.post('/kitchen', async (req, res) => {
  try {
    const { username, password, role } = req.body

    // Check if user already exists
    const existingUser = await User.findOne({ where: { username } })
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' })
    }

    // Hash password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    const user = await User.create({
      username,
      password: hashedPassword,
      role: role || 'kitchen',
    })

    const userResponse = user.toJSON()
    delete userResponse.password

    res.status(201).json(userResponse)
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
})

// Update user
router.put('/:id', async (req, res) => {
  try {
    const { username, password, role } = req.body
    const updateData = { username, role }

    if (password) {
      const salt = await bcrypt.genSalt(10)
      updateData.password = await bcrypt.hash(password, salt)
    }

    const user = await User.findByPk(req.params.id)
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
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id)
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
