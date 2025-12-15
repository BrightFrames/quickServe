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

    if (!slug || slug.trim() === '') {
      return res.status(400).json({
        message: 'Restaurant slug is required',
        error: 'SLUG_REQUIRED'
      });
    }

    // Check cache first
    const cacheKey = `public:menu:${slug}`;
    const cachedData = cache.get(cacheKey);

    if (cachedData) {
      return res.json(cachedData);
    }

    // CRITICAL: Determine if identifier is slug or ID
    const isNumericId = /^\d+$/.test(slug);
    let restaurant;

    if (isNumericId) {
      // Find by ID
      restaurant = await Restaurant.findByPk(slug, {
        attributes: ['id', 'name', 'slug', 'email', 'phone', 'address', 'restaurantCode']
      });
    } else {
      // Find by slug
      const normalizedSlug = slug.toLowerCase().trim();
      restaurant = await Restaurant.findOne({
        where: { slug: normalizedSlug },
        attributes: ['id', 'name', 'slug', 'email', 'phone', 'address', 'restaurantCode']
      });
    }

    // FAIL FAST: If restaurant not found, this is a BAD request
    if (!restaurant) {
      return res.status(404).json({
        message: `Restaurant not found for identifier: ${slug}`,
        error: 'RESTAURANT_NOT_FOUND',
        identifier: slug
      });
    }

    // Fetch menu items for this restaurant (available items only)
    const menu = await MenuItem.findAll({
      where: {
        restaurantId: restaurant.id,
        available: true
      },
      order: [['category', 'ASC'], ['name', 'ASC']],
      attributes: ['id', 'name', 'description', 'price', 'category', 'image', 'isVegetarian', 'available', 'averageRating', 'totalRatings', 'restaurantId']
    });

    const responseData = {
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug,
        email: restaurant.email,
        phone: restaurant.phone,
        address: restaurant.address,
        restaurantCode: restaurant.restaurantCode
      },
      menu
    };

    // Cache the response
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
