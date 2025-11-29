import express from 'express'
import MenuItem from '../models/MenuItem.js'
import Restaurant from '../models/Restaurant.js'
import { authenticateRestaurant, optionalRestaurantAuth } from '../middleware/auth.js'

const router = express.Router()

// Apply authentication middleware to all routes
router.use(authenticateRestaurant);

// Get all menu items for authenticated restaurant
router.get('/', async (req, res) => {
  try {
    const items = await MenuItem.findAll({
      where: { restaurantId: req.restaurantId },
      order: [['category', 'ASC'], ['name', 'ASC']],
    });
    
    console.log(`[MENU] Retrieved ${items.length} items for restaurant ${req.restaurantId}`);
    res.json(items);
  } catch (error) {
    console.error('[MENU] Error fetching menu items:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single menu item
router.get('/:id', async (req, res) => {
  try {
    const item = await MenuItem.findOne({
      where: { 
        id: req.params.id,
        restaurantId: req.restaurantId 
      }
    });
    
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create menu item
router.post('/', async (req, res) => {
  try {
    console.log('[MENU] Create menu item request for restaurant', req.restaurantId);
    
    const item = await MenuItem.create({
      ...req.body,
      restaurantId: req.restaurantId
    });
    console.log('[MENU] ✓ Menu item created:', item.name);
    res.status(201).json(item);
  } catch (error) {
    console.error('[MENU] Error creating menu item:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update menu item
router.put('/:id', async (req, res) => {
  try {
    const item = await MenuItem.findOne({
      where: { 
        id: req.params.id,
        restaurantId: req.restaurantId 
      }
    });
    
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    await item.update(req.body);
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update inventory
router.put('/:id/inventory', async (req, res) => {
  try {
    const { inventoryCount } = req.body;
    const item = await MenuItem.findOne({
      where: { 
        id: req.params.id,
        restaurantId: req.restaurantId 
      }
    });
    
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    await item.update({ inventoryCount });
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete menu item
router.delete('/:id', async (req, res) => {
  try {
    const item = await MenuItem.findOne({
      where: { 
        id: req.params.id,
        restaurantId: req.restaurantId 
      }
    });
    
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    await item.destroy();
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router
