// Middleware to identify restaurant and attach tenant database models
import Restaurant from '../models/Restaurant.js';
import { getTenantModels, createTenantSchema } from '../config/tenantDatabase.js';

/**
 * Extract restaurant slug from request
 * Supports: /api/menu/:slug, /:slug/customer, headers, query params
 */
function extractRestaurantSlug(req) {
  // 1. Check route params
  if (req.params.slug || req.params.restaurantSlug) {
    return req.params.slug || req.params.restaurantSlug;
  }

  // 2. Check query params
  if (req.query.slug || req.query.restaurantSlug) {
    return req.query.slug || req.query.restaurantSlug;
  }

  // 3. Check custom header
  if (req.headers['x-restaurant-slug']) {
    return req.headers['x-restaurant-slug'];
  }

  // 4. Check body
  if (req.body && (req.body.slug || req.body.restaurantSlug)) {
    return req.body.slug || req.body.restaurantSlug;
  }

  return null;
}

/**
 * Tenant middleware - attaches restaurant-specific database to request
 */
export const tenantMiddleware = async (req, res, next) => {
  try {
    const slug = extractRestaurantSlug(req);

    if (!slug) {
      // No slug found - skip tenant context (for admin routes, etc.)
      return next();
    }

    // Get restaurant from main database
    const restaurant = await Restaurant.findOne({
      where: { slug },
    });

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found',
      });
    }

    // Get tenant-specific models
    const tenantModels = await getTenantModels(slug);

    // Attach to request object
    req.tenant = {
      slug,
      restaurant,
      models: tenantModels,
    };

    console.log(`[TENANT] Request routed to: ${restaurant.name} (${slug})`);
    next();
  } catch (error) {
    console.error('[TENANT] Middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load restaurant data',
    });
  }
};

/**
 * Require tenant middleware - ensures tenant context exists
 */
export const requireTenant = (req, res, next) => {
  if (!req.tenant) {
    return res.status(400).json({
      success: false,
      message: 'Restaurant context required',
    });
  }
  next();
};

/**
 * Initialize tenant on restaurant creation
 */
export async function initializeRestaurantTenant(restaurantSlug) {
  try {
    console.log(`[TENANT] Initializing database for restaurant: ${restaurantSlug}`);
    
    // Create schema and initialize database
    const tenantDb = await createTenantSchema(restaurantSlug);
    const { default: MenuItem } = await import('../models/MenuItem.js');
    const { default: Order } = await import('../models/Order.js');
    const { default: Table } = await import('../models/Table.js');
    const { default: User } = await import('../models/User.js');
    const { default: Rating } = await import('../models/Rating.js');

    // Initialize models
    MenuItem.init(MenuItem.rawAttributes, { sequelize: tenantDb });
    Order.init(Order.rawAttributes, { sequelize: tenantDb });
    Table.init(Table.rawAttributes, { sequelize: tenantDb });
    User.init(User.rawAttributes, { sequelize: tenantDb });
    Rating.init(Rating.rawAttributes, { sequelize: tenantDb });

    // Sync
    await tenantDb.sync({ alter: true });

    // Create default kitchen user
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.default.hash('kitchen123', 10);
    
    await User.create({
      username: 'kitchen1',
      password: hashedPassword,
      role: 'kitchen',
      restaurantId: 1, // Placeholder, not used in tenant schema
    });

    console.log(`[TENANT] ✓ Restaurant database initialized: ${restaurantSlug}`);
    return true;
  } catch (error) {
    console.error(`[TENANT] Failed to initialize restaurant tenant:`, error);
    throw error;
  }
}

export default tenantMiddleware;
