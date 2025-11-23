import express from 'express'
import MenuItem from '../models/MenuItem.js'

const router = express.Router()

// Get all menu items
router.get('/', async (req, res) => {
  try {
    const items = await MenuItem.find().sort({ category: 1, name: 1 })
    res.json(items)
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
})

// Get single menu item
router.get('/:id', async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id)
    if (!item) {
      return res.status(404).json({ message: 'Item not found' })
    }
    res.json(item)
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
})

// Create menu item
router.post('/', async (req, res) => {
  try {
    const item = new MenuItem(req.body)
    await item.save()
    res.status(201).json(item)
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
})

// Update menu item
router.put('/:id', async (req, res) => {
  try {
    const item = await MenuItem.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    if (!item) {
      return res.status(404).json({ message: 'Item not found' })
    }
    res.json(item)
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
})

// Update inventory
router.put('/:id/inventory', async (req, res) => {
  try {
    const { inventoryCount } = req.body
    const item = await MenuItem.findByIdAndUpdate(
      req.params.id,
      { inventoryCount },
      { new: true }
    )
    if (!item) {
      return res.status(404).json({ message: 'Item not found' })
    }
    res.json(item)
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
})

// Delete menu item
router.delete('/:id', async (req, res) => {
  try {
    const item = await MenuItem.findByIdAndDelete(req.params.id)
    if (!item) {
      return res.status(404).json({ message: 'Item not found' })
    }
    res.json({ message: 'Item deleted successfully' })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
})

export default router
