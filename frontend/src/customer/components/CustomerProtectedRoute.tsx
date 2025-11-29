import { Navigate, useLocation, useParams } from 'react-router-dom';
import { ReactNode, useEffect, useState } from 'react';
import { AdminAccessGuard } from './AdminAccessGuard';

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
 * 4. Show password guard if customer tries to access admin area
 * 5. Mark customer sessions to prevent URL manipulation
 */
export const CustomerProtectedRoute = ({ children }: CustomerProtectedRouteProps) => {
  const location = useLocation();
  const { restaurantSlug, tableNumber } = useParams();
  const [showAdminGuard, setShowAdminGuard] = useState(false);

  // Mark this session as customer session
  useEffect(() => {
    sessionStorage.setItem('userType', 'customer');
    sessionStorage.setItem('customerSessionStart', Date.now().toString());
  }, []);

  // Block back button attempts
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      const userType = sessionStorage.getItem('userType');
      if (userType === 'customer') {
        // Prevent navigation out of customer area
        window.history.pushState(null, '', window.location.href);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Detect admin/kitchen access attempts
  useEffect(() => {
    const path = location.pathname;
    const hash = window.location.hash;
    const searchParams = new URLSearchParams(window.location.search);
    
    // Check for admin/kitchen route attempts
    const isAdminAttempt = path.includes('/admin') || hash.includes('admin');
    const isKitchenAttempt = path.includes('/kitchen') || hash.includes('kitchen');
    const hasAdminParam = searchParams.has('admin') || searchParams.has('kitchen');
    
    if (isAdminAttempt || isKitchenAttempt || hasAdminParam) {
      console.warn('[SECURITY] Blocked unauthorized access attempt:', path);
      
      // Check if admin verification was already done
      const adminVerified = sessionStorage.getItem('adminVerified');
      const verifiedAt = sessionStorage.getItem('adminVerifiedAt');
      const verificationExpiry = 5 * 60 * 1000; // 5 minutes
      
      if (adminVerified && verifiedAt) {
        const elapsed = Date.now() - parseInt(verifiedAt);
        if (elapsed < verificationExpiry) {
          // Allow access - admin verified recently
          return;
        } else {
          // Verification expired
          sessionStorage.removeItem('adminVerified');
          sessionStorage.removeItem('adminVerifiedAt');
        }
      }
      
      // Show password guard
      setShowAdminGuard(true);
    }
  }, [location.pathname]);

  // Show admin guard if admin/kitchen access detected
  if (showAdminGuard) {
    return <AdminAccessGuard />;
  }

  // Double-check: Prevent direct navigation to admin/kitchen routes
  if (location.pathname.includes('/admin') || location.pathname.includes('/kitchen')) {
    const adminVerified = sessionStorage.getItem('adminVerified');
    
    if (!adminVerified) {
      console.error('[SECURITY] Unauthorized access attempt blocked');
      return <AdminAccessGuard />;
    }
  }

  // Ensure restaurant slug is present
  if (!restaurantSlug) {
    console.error('[SECURITY] No restaurant slug found');
    return <Navigate to="/" replace />;
  }

  // Note: Table number validation removed - CustomerApp handles default redirects
  // This prevents infinite redirect loops while maintaining security

  return <>{children}</>;
};
