/**
 * Simple in-memory cache for frequently accessed data
 * For production with multiple servers, consider Redis
 */

class SimpleCache {
  constructor() {
    this.cache = new Map();
    this.timers = new Map();
  }

  /**
   * Set a value in cache with optional TTL (time to live)
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in milliseconds (default: 5 minutes)
   */
  set(key, value, ttl = 5 * 60 * 1000) {
    // Clear existing timer if any
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
    }

    // Set the value
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
    });

    // Set expiration timer
    const timer = setTimeout(() => {
      this.delete(key);
    }, ttl);

    this.timers.set(key, timer);
  }

  /**
   * Get a value from cache
   * @param {string} key - Cache key
   * @returns {any} Cached value or undefined
   */
  get(key) {
    const cached = this.cache.get(key);
    if (!cached) return undefined;
    
    return cached.value;
  }

  /**
   * Check if a key exists in cache
   * @param {string} key - Cache key
   * @returns {boolean}
   */
  has(key) {
    return this.cache.has(key);
  }

  /**
   * Delete a value from cache
   * @param {string} key - Cache key
   */
  delete(key) {
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }
    this.cache.delete(key);
  }

  /**
   * Clear all cached values
   */
  clear() {
    // Clear all timers
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();
    this.cache.clear();
  }

  /**
   * Get cache statistics
   * @returns {object} Cache stats
   */
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  /**
   * Cache middleware for Express routes
   * @param {number} ttl - Time to live in milliseconds
   * @returns {Function} Express middleware
   */
  middleware(ttl = 5 * 60 * 1000) {
    return (req, res, next) => {
      // Only cache GET requests
      if (req.method !== 'GET') {
        return next();
      }

      // Create cache key from URL and query params
      const cacheKey = `${req.path}:${JSON.stringify(req.query)}`;

      // Check if response is cached
      const cached = this.get(cacheKey);
      if (cached) {
        console.log(`[CACHE] HIT: ${cacheKey}`);
        return res.json(cached);
      }

      // Store original res.json
      const originalJson = res.json.bind(res);

      // Override res.json to cache the response
      res.json = (data) => {
        this.set(cacheKey, data, ttl);
        console.log(`[CACHE] SET: ${cacheKey}`);
        return originalJson(data);
      };

      next();
    };
  }
}

// Export singleton instance
export const cache = new SimpleCache();

// Cache key generators for consistency
export const cacheKeys = {
  restaurant: (identifier) => `restaurant:${identifier}`,
  menu: (restaurantId) => `menu:${restaurantId}`,
  menuItem: (restaurantId, itemId) => `menu:${restaurantId}:item:${itemId}`,
  categories: (restaurantId) => `categories:${restaurantId}`,
  tables: (restaurantId) => `tables:${restaurantId}`,
  orders: (restaurantId, status) => `orders:${restaurantId}:${status || 'all'}`,
};

// Utility to invalidate restaurant-related caches
export const invalidateRestaurantCache = (restaurantId) => {
  cache.delete(cacheKeys.menu(restaurantId));
  cache.delete(cacheKeys.categories(restaurantId));
  cache.delete(cacheKeys.tables(restaurantId));
  console.log(`[CACHE] Invalidated all caches for restaurant ${restaurantId}`);
};
