import express from 'express'
import MenuItem from '../models/MenuItem.js'
import Restaurant from '../models/Restaurant.js'
import { authenticateRestaurant, optionalRestaurantAuth } from '../middleware/auth.js'
import { enforceTenantIsolation, requirePermission } from '../middleware/rbac.js'
import { cache, cacheKeys } from '../utils/cache.js'

const router = express.Router()

/**
 * Helper: Map restaurant slug to restaurantId (primary key)
 * This ensures all queries use the database primary key for consistency
 * @param {string} slug - Restaurant slug
 * @returns {Promise<number|null>} Restaurant ID or null if not found
 */
async function getRestaurantIdBySlug(slug) {
  if (!slug || typeof slug !== 'string') {
    console.log('[MENU] Invalid slug provided');
    return null;
  }
  
  const restaurant = await Restaurant.findOne({ 
    where: { slug: slug.toLowerCase().trim() },
    attributes: ['id'] // Only fetch the ID for efficiency
  });
  
  return restaurant ? restaurant.id : null;
}

/**
 * Helper: Validate restaurant ID is a valid integer
 * @param {any} id - Restaurant ID to validate
 * @returns {boolean} True if valid
 */
function isValidRestaurantId(id) {
  const numId = parseInt(id, 10);
  return !isNaN(numId) && numId > 0;
}

// Public route: Get menu by restaurant slug (for customers)
router.get('/', async (req, res) => {
  try {
    const { slug, restaurantId } = req.query;
    
    // If slug or restaurantId provided, this is a public customer request
    if (slug || restaurantId) {
      let finalRestaurantId = null;
      
      // Prefer direct restaurantId if provided and valid
      if (restaurantId && isValidRestaurantId(restaurantId)) {
        finalRestaurantId = parseInt(restaurantId, 10);
        console.log(`[MENU] Public menu request for restaurantId: ${finalRestaurantId}`);
      } 
      // Fallback to slug lookup and map to restaurantId
      else if (slug) {
        console.log(`[MENU] Public menu request for slug: ${slug}, mapping to restaurantId...`);
        finalRestaurantId = await getRestaurantIdBySlug(slug);
      }
      
      // Validate we have a valid restaurantId
      if (!finalRestaurantId) {
        console.log(`[MENU] Restaurant not found for slug: ${slug} or id: ${restaurantId}`);
        return res.status(404).json({ message: 'Restaurant not found' });
      }
      
      // Check cache first
      const cacheKey = cacheKeys.menu(finalRestaurantId);
      const cachedMenu = cache.get(cacheKey);
      
      if (cachedMenu) {
        console.log(`[CACHE] Menu cache HIT for restaurant ${finalRestaurantId}`);
        return res.json(cachedMenu);
      }
      
      // CORE FIX: All queries now use restaurantId (primary key) consistently
      const items = await MenuItem.findAll({
        where: { restaurantId: finalRestaurantId },
        order: [['category', 'ASC'], ['name', 'ASC']],
      });
      
      // Cache for 10 minutes (menu doesn't change frequently)
      cache.set(cacheKey, items, 10 * 60 * 1000);
      console.log(`[MENU] Retrieved ${items.length} menu items for restaurantId: ${finalRestaurantId}`);
      
      return res.json(items);
    }
    
    // No slug - this is an admin request, require authentication
    // Check for Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[MENU] Admin request without authentication');
      return res.status(401).json({ message: 'Authentication required for admin access' });
    }
    
    // Call authenticateRestaurant middleware manually
    return authenticateRestaurant(req, res, async () => {
      const items = await MenuItem.findAll({
        where: { restaurantId: req.restaurantId },
        order: [['category', 'ASC'], ['name', 'ASC']],
      });
      
      console.log(`[MENU] Retrieved ${items.length} items for restaurant ${req.restaurantId}`);
      res.json(items);
    });
  } catch (error) {
    console.error('[MENU] Error fetching menu items:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Apply authentication middleware to all other routes (admin only)
router.use(authenticateRestaurant);

// Get single menu item (authenticated - uses restaurantId from token)
router.get('/:id', async (req, res) => {
  try {
    // Validate menu item ID
    const menuItemId = parseInt(req.params.id, 10);
    if (isNaN(menuItemId) || menuItemId <= 0) {
      return res.status(400).json({ message: 'Invalid menu item ID' });
    }
    
    // Validate restaurantId from auth middleware
    if (!req.restaurantId || !isValidRestaurantId(req.restaurantId)) {
      return res.status(401).json({ message: 'Invalid restaurant authentication' });
    }
    
    // CORE FIX: Query using both primary keys for data integrity
    const item = await MenuItem.findOne({
      where: { 
        id: menuItemId,
        restaurantId: req.restaurantId // Always filter by restaurantId
      }
    });
    
    if (!item) {
      console.log(`[MENU] Item ${menuItemId} not found for restaurantId ${req.restaurantId}`);
      return res.status(404).json({ message: 'Item not found' });
    }
    
    console.log(`[MENU] Retrieved item ${item.name} (id: ${item.id}) for restaurantId ${req.restaurantId}`);
    res.json(item);
  } catch (error) {
    console.error('[MENU] Error fetching menu item:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create menu item (authenticated - ensures restaurantId consistency)
router.post('/', authenticateRestaurant, enforceTenantIsolation, requirePermission('manage:menu'), async (req, res) => {
  try {
    // Validate restaurantId from auth middleware
    if (!req.restaurantId || !isValidRestaurantId(req.restaurantId)) {
      return res.status(401).json({ message: 'Invalid restaurant authentication' });
    }
    
    console.log('[MENU] Create menu item request for restaurantId:', req.restaurantId);
    
    // CORE FIX: Always use restaurantId from authenticated token, never from request body
    const itemData = { ...req.body };
    delete itemData.restaurantId; // Remove any restaurantId from request body
    
    const item = await MenuItem.create({
      ...itemData,
      restaurantId: req.restaurantId // Force restaurantId from authentication
    });
    
    // Invalidate cache for this restaurant's menu
    cache.delete(cacheKeys.menu(req.restaurantId));
    console.log(`[CACHE] Invalidated menu cache for restaurant ${req.restaurantId}`);
    
    console.log(`[MENU] ✓ Menu item created: ${item.name} (id: ${item.id}) for restaurantId ${req.restaurantId}`);
    res.status(201).json(item);
  } catch (error) {
    console.error('[MENU] Error creating menu item:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update menu item
router.put('/:id', authenticateRestaurant, enforceTenantIsolation, requirePermission('manage:menu'), async (req, res) => {
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
    
    // Invalidate cache for this restaurant's menu
    cache.delete(cacheKeys.menu(req.restaurantId));
    console.log(`[CACHE] Invalidated menu cache for restaurant ${req.restaurantId}`);
    
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
    
    // Invalidate cache for this restaurant's menu
    cache.delete(cacheKeys.menu(req.restaurantId));
    console.log(`[CACHE] Invalidated menu cache for restaurant ${req.restaurantId}`);
    
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete menu item
router.delete('/:id', authenticateRestaurant, enforceTenantIsolation, requirePermission('manage:menu'), async (req, res) => {
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
    
    // Invalidate cache for this restaurant's menu
    cache.delete(cacheKeys.menu(req.restaurantId));
    console.log(`[CACHE] Invalidated menu cache for restaurant ${req.restaurantId}`);
    
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router
