import express from 'express';
import Restaurant from '../models/Restaurant.js';
import MenuItem from '../models/MenuItem.js';
import { cache, cacheKeys } from '../utils/cache.js';

const router = express.Router();

/**
 * PUBLIC CUSTOMER ROUTE
 * GET /public/menu/:slug
 * 
 * Returns restaurant information and full menu for customers who scan QR codes.
 * No authentication required - this is completely public.
 * 
 * @param {string} slug - Restaurant slug from QR code URL
 * @returns {object} { restaurant: {...}, menu: [...] }
 */
router.get('/menu/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    
    console.log(`[PUBLIC] Customer menu request for slug: ${slug}`);
    
    if (!slug) {
      return res.status(400).json({ message: 'Restaurant slug is required' });
    }

    // Check cache first
    const cacheKey = `public:menu:${slug}`;
    const cachedData = cache.get(cacheKey);
    
    if (cachedData) {
      console.log(`[PUBLIC] Cache HIT for slug: ${slug}`);
      return res.json(cachedData);
    }

    // Find restaurant by slug
    const restaurant = await Restaurant.findOne({
      where: { slug: slug.toLowerCase().trim() },
      attributes: ['id', 'name', 'slug', 'email', 'phone', 'address', 'restaurantCode', 'description']
    });

    if (!restaurant) {
      console.log(`[PUBLIC] Restaurant not found for slug: ${slug}`);
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    console.log(`[PUBLIC] Restaurant found: ${restaurant.name} (ID: ${restaurant.id})`);

    // Fetch menu items for this restaurant
    const menu = await MenuItem.findAll({
      where: { 
        restaurantId: restaurant.id,
        available: true // Only show available items to customers
      },
      order: [['category', 'ASC'], ['name', 'ASC']],
      attributes: ['id', 'name', 'description', 'price', 'category', 'image', 'isVegetarian', 'available', 'averageRating', 'totalRatings']
    });

    console.log(`[PUBLIC] Retrieved ${menu.length} menu items for ${restaurant.name}`);

    const responseData = {
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug,
        email: restaurant.email,
        phone: restaurant.phone,
        address: restaurant.address,
        restaurantCode: restaurant.restaurantCode,
        description: restaurant.description
      },
      menu
    };

    // Cache for 5 minutes (menu doesn't change frequently for customers)
    cache.set(cacheKey, responseData, 5 * 60 * 1000);

    res.json(responseData);

  } catch (error) {
    console.error('[PUBLIC] Error fetching public menu:', error);
    res.status(500).json({ 
      message: 'Error loading restaurant menu', 
      error: error.message 
    });
  }
});

export default router;
