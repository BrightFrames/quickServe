import express from 'express'
import MenuItem from '../models/MenuItem.js'
import Restaurant from '../models/Restaurant.js'
import { authenticateRestaurant, optionalRestaurantAuth } from '../middleware/auth.js'

const router = express.Router()

// Get all menu items (with optional restaurant filter for customer view)
router.get('/', optionalRestaurantAuth, async (req, res) => {
  try {
    const { slug } = req.query;
    
    const whereClause = {};
    
    // If slug is provided, resolve to restaurantId
    if (slug) {
      const restaurant = await Restaurant.findOne({ where: { slug } });
      if (restaurant) {
        whereClause.restaurantId = restaurant.id;
      }
    } else if (req.restaurantId) {
      whereClause.restaurantId = req.restaurantId;
    }
    
    const items = await MenuItem.findAll({
      where: whereClause,
      order: [['category', 'ASC'], ['name', 'ASC']],
    })
    res.json(items)
  } catch (error) {
    console.error('[MENU] Error fetching menu items:', error);
    res.status(500).json({ message: 'Server error', error: error.message })
  }
})

// Get single menu item
router.get('/:id', async (req, res) => {
  try {
    const item = await MenuItem.findByPk(req.params.id)
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
    console.log('[MENU] Create menu item request:', req.body);
    
    let restaurantId = req.body.restaurantId;
    
    // If slug is provided instead of restaurantId, resolve it
    if (req.body.slug) {
      const restaurant = await Restaurant.findOne({ where: { slug: req.body.slug } });
      if (restaurant) {
        restaurantId = restaurant.id;
      }
    }
    
    // Validate restaurantId is provided or resolved
    if (!restaurantId) {
      console.error('[MENU] restaurantId or slug is required');
      return res.status(400).json({ message: 'restaurantId or slug is required to create menu item' });
    }
    
    const item = await MenuItem.create({ ...req.body, restaurantId })
    console.log('[MENU] Menu item created:', item.id);
    res.status(201).json(item)
  } catch (error) {
    console.error('[MENU] Error creating menu item:', error);
    res.status(500).json({ message: 'Server error', error: error.message })
  }
})

// Update menu item
router.put('/:id', async (req, res) => {
  try {
    const item = await MenuItem.findByPk(req.params.id)
    if (!item) {
      return res.status(404).json({ message: 'Item not found' })
    }
    await item.update(req.body)
    res.json(item)
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
})

// Update inventory
router.put('/:id/inventory', async (req, res) => {
  try {
    const { inventoryCount } = req.body
    const item = await MenuItem.findByPk(req.params.id)
    if (!item) {
      return res.status(404).json({ message: 'Item not found' })
    }
    await item.update({ inventoryCount })
    res.json(item)
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
})

// Delete menu item
router.delete('/:id', async (req, res) => {
  try {
    const item = await MenuItem.findByPk(req.params.id)
    if (!item) {
      return res.status(404).json({ message: 'Item not found' })
    }
    await item.destroy()
    res.json({ message: 'Item deleted successfully' })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
})

export default router
