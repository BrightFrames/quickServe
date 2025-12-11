import jwt from 'jsonwebtoken';

/**
 * Role-Based Access Control Middleware
 * Enforces permission checks on backend routes
 */

// Permission matrix: what each role can do
const PERMISSIONS = {
  admin: [
    'read:all',
    'write:all',
    'delete:all',
    'manage:users',
    'manage:menu',
    'manage:orders',
    'manage:settings',
    'view:analytics',
  ],
  captain: [
    'read:orders',
    'write:orders',
    'read:tables',
    'write:tables',
    'read:menu',
    'create:orders',
  ],
  kitchen: [
    'read:orders',
    'update:order_status', // Only update status, not create/delete
    'read:menu',
  ],
  reception: [
    'read:orders',
    'create:orders',
    'read:tables',
    'write:tables',
    'read:menu',
  ],
  cashier: [
    'read:orders',
    'update:payment_status',
    'view:analytics',
  ],
  viewer: [
    'read:orders',
    'read:menu',
    'read:tables',
  ],
};

/**
 * Check if user has required permission
 */
export function hasPermission(userRole, requiredPermission) {
  const rolePermissions = PERMISSIONS[userRole] || [];
  
  // Check for wildcard permissions (read:all, write:all)
  if (rolePermissions.includes('read:all') || rolePermissions.includes('write:all')) {
    return true;
  }
  
  return rolePermissions.includes(requiredPermission);
}

/**
 * Middleware factory: Require specific permission
 * Usage: router.get('/orders', requirePermission('read:orders'), handler)
 */
export function requirePermission(permission) {
  return (req, res, next) => {
    const userRole = req.userRole || req.user?.role;
    
    if (!userRole) {
      return res.status(401).json({
        message: 'Authentication required',
        error: 'User role not found in request',
      });
    }
    
    if (!hasPermission(userRole, permission)) {
      console.log(`[RBAC] Permission denied: ${userRole} attempted ${permission}`);
      return res.status(403).json({
        message: 'Access denied',
        error: `Role '${userRole}' does not have permission '${permission}'`,
      });
    }
    
    console.log(`[RBAC] ✓ Permission granted: ${userRole} → ${permission}`);
    next();
  };
}

/**
 * Middleware factory: Require one of multiple roles
 * Usage: router.post('/orders', requireRole(['admin', 'captain']), handler)
 */
export function requireRole(allowedRoles) {
  return (req, res, next) => {
    const userRole = req.userRole || req.user?.role;
    
    if (!userRole) {
      return res.status(401).json({
        message: 'Authentication required',
        error: 'User role not found',
      });
    }
    
    if (!allowedRoles.includes(userRole)) {
      console.log(`[RBAC] Role check failed: ${userRole} not in ${allowedRoles.join(', ')}`);
      return res.status(403).json({
        message: 'Access denied',
        error: `This action requires one of: ${allowedRoles.join(', ')}`,
        userRole,
      });
    }
    
    console.log(`[RBAC] ✓ Role check passed: ${userRole}`);
    next();
  };
}

/**
 * CRITICAL MULTI-TENANT SECURITY MIDDLEWARE
 * Enforces strict tenant isolation - users can ONLY access their own restaurant's data
 * 
 * This middleware:
 * 1. Validates restaurantId from authenticated JWT token
 * 2. Compares with restaurantId in request (params/body/query)
 * 3. Blocks cross-tenant access attempts with 403 Forbidden
 * 4. Logs all violation attempts for security audit
 * 
 * MUST be applied to ALL routes handling restaurant-specific data
 */
export function enforceTenantIsolation(req, res, next) {
  try {
    const userRestaurantId = req.restaurantId; // Set by authenticateRestaurant middleware
    
    if (!userRestaurantId) {
      console.log('[TENANT ISOLATION] ❌ No restaurantId in request - authentication required');
      return res.status(401).json({
        message: 'Authentication required',
        error: 'Restaurant ID not found in token. Please login again.',
      });
    }
    
    // Check all possible locations where restaurantId might be specified
    const requestedRestaurantId = 
      req.params.restaurantId || 
      req.query.restaurantId || 
      req.body.restaurantId ||
      req.params.restaurant_id ||
      req.query.restaurant_id ||
      req.body.restaurant_id;
    
    // If a specific restaurant is requested, validate it matches user's restaurant
    if (requestedRestaurantId) {
      const requestedId = parseInt(requestedRestaurantId, 10);
      const userId = parseInt(userRestaurantId, 10);
      
      if (isNaN(requestedId) || isNaN(userId)) {
        console.log('[TENANT ISOLATION] ❌ Invalid restaurantId format');
        return res.status(400).json({
          message: 'Invalid restaurant ID format',
          error: 'Restaurant ID must be a valid number',
        });
      }
      
      if (requestedId !== userId) {
        console.log(`[TENANT ISOLATION] ❌ CRITICAL SECURITY VIOLATION BLOCKED`);
        console.log(`[TENANT ISOLATION] User from restaurant ${userId} attempted to access restaurant ${requestedId}`);
        console.log(`[TENANT ISOLATION] Request: ${req.method} ${req.path}`);
        console.log(`[TENANT ISOLATION] User: ${req.username || 'unknown'} Role: ${req.userRole || 'unknown'}`);
        
        return res.status(403).json({
          message: 'Access denied',
          error: 'You can only access data from your own restaurant',
        });
      }
      
      console.log(`[TENANT ISOLATION] ✓ Validated: restaurant ${userId} accessing own data`);
    } else {
      // No explicit restaurantId in request - use authenticated user's restaurantId
      console.log(`[TENANT ISOLATION] ✓ No explicit restaurantId, using authenticated restaurant: ${userRestaurantId}`);
    }
    
    // Ensure restaurantId is available for route handlers
    req.restaurantId = userRestaurantId;
    
    next();
  } catch (error) {
    console.error('[TENANT ISOLATION] Error:', error);
    return res.status(500).json({
      message: 'Internal server error',
      error: 'Failed to validate tenant isolation',
    });
  }
}

export default {
  requirePermission,
  requireRole,
  enforceTenantIsolation,
  hasPermission,
};
