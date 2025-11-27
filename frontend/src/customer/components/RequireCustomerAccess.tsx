import { useEffect, useState } from 'react';
import { useParams, useLocation, Navigate } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

interface RequireCustomerAccessProps {
  children: React.ReactNode;
}

export default function RequireCustomerAccess({ children }: RequireCustomerAccessProps) {
  const { restaurantSlug } = useParams();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [requiresAuth, setRequiresAuth] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      // Check if already verified in session
      const verifiedSlug = sessionStorage.getItem(`customer_verified_${restaurantSlug}`);
      if (verifiedSlug === 'true') {
        setIsChecking(false);
        setRequiresAuth(false);
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/customer-auth/check-auth/${restaurantSlug}`
        );
        const data = await response.json();

        if (data.requiresAuth) {
          setRequiresAuth(true);
        }
      } catch (error) {
        console.error('Failed to check customer access:', error);
        // On error, allow access (fail open) to prevent blocking legitimate users
      } finally {
        setIsChecking(false);
      }
    };

    checkAccess();
  }, [restaurantSlug]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-orange-50 to-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (requiresAuth) {
    // Redirect to access page with return URL
    return (
      <Navigate 
        to={`/${restaurantSlug}/customer/access`} 
        state={{ from: location.pathname }} 
        replace 
      />
    );
  }

  return <>{children}</>;
}
