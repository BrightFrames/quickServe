import { Navigate, useLocation, useParams } from 'react-router-dom';
import { ReactNode, useEffect } from 'react';

interface CustomerProtectedRouteProps {
  children: ReactNode;
}

/**
 * CustomerProtectedRoute - Prevents unauthorized access to admin/kitchen routes from customer pages
 * 
 * Security Rules:
 * 1. Block access to /admin/* and /kitchen/* routes
 * 2. Ensure customers can only access their restaurant's customer area
 * 3. Validate table number is present for menu access
 */
export const CustomerProtectedRoute = ({ children }: CustomerProtectedRouteProps) => {
  const location = useLocation();
  const { restaurantSlug, tableNumber } = useParams();

  // Block any attempts to access admin or kitchen routes
  useEffect(() => {
    const path = location.pathname;
    
    // Detect if user is trying to access admin/kitchen areas
    if (path.includes('/admin') || path.includes('/kitchen')) {
      console.warn('[SECURITY] Blocked unauthorized access attempt:', path);
    }
  }, [location.pathname]);

  // Prevent access to admin/kitchen routes
  if (location.pathname.includes('/admin') || location.pathname.includes('/kitchen')) {
    console.error('[SECURITY] Unauthorized access attempt blocked');
    
    // Redirect back to customer menu
    if (restaurantSlug) {
      return <Navigate to={`/${restaurantSlug}/customer/menu/table/${tableNumber || 't1'}`} replace />;
    }
    return <Navigate to="/" replace />;
  }

  // Ensure restaurant slug is present
  if (!restaurantSlug) {
    console.error('[SECURITY] No restaurant slug found');
    return <Navigate to="/" replace />;
  }

  // For menu page, ensure table number is present
  if (location.pathname.includes('/menu') && !tableNumber) {
    console.warn('[SECURITY] Menu access without table number, redirecting to default');
    return <Navigate to={`/${restaurantSlug}/customer/menu/table/t1`} replace />;
  }

  return <>{children}</>;
};
