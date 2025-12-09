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
 * Middleware: Verify user can only access their own restaurant's data
 * CRITICAL for multi-tenant isolation
 */
export function enforceTenantIsolation(req, res, next) {
  const userRestaurantId = req.restaurantId; // Set by authenticateRestaurant middleware
  
  if (!userRestaurantId) {
    return res.status(401).json({
      message: 'Authentication required',
      error: 'Restaurant ID not found in token',
    });
  }
  
  // Check various places where restaurantId might be specified
  const requestedRestaurantId = 
    req.params.restaurantId || 
    req.query.restaurantId || 
    req.body.restaurantId;
  
  // If a specific restaurant is requested, verify it matches user's restaurant
  if (requestedRestaurantId) {
    const requestedId = parseInt(requestedRestaurantId, 10);
    const userId = parseInt(userRestaurantId, 10);
    
    if (requestedId !== userId) {
      console.log(`[TENANT ISOLATION] ❌ Access denied: User from restaurant ${userId} tried to access restaurant ${requestedId}`);
      return res.status(403).json({
        message: 'Access denied',
        error: 'You can only access data from your own restaurant',
      });
    }
  }
  
  console.log(`[TENANT ISOLATION] ✓ Validated: restaurant ${userRestaurantId}`);
  next();
}

export default {
  requirePermission,
  requireRole,
  enforceTenantIsolation,
  hasPermission,
};
