import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';

interface RestaurantContextType {
  restaurantName: string | null;
  restaurantSlug: string | null;
  restaurantCode: string | null;
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

export const RestaurantProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { restaurantSlug } = useParams<{ restaurantSlug: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [restaurantName, setRestaurantName] = useState<string | null>(null);
  const [restaurantCode, setRestaurantCode] = useState<string | null>(null);
  const [storedSlug, setStoredSlug] = useState<string | null>(null);

  useEffect(() => {
    // Get restaurant data from localStorage (set by verification page)
    const storedRestaurantName = localStorage.getItem('restaurantName');
    const storedRestaurantCode = localStorage.getItem('restaurantCode');
    const storedRestaurantSlug = localStorage.getItem('restaurantSlug');
    
    if (storedRestaurantName && storedRestaurantCode) {
      setRestaurantName(storedRestaurantName);
      setRestaurantCode(storedRestaurantCode);
    }
    
    if (storedRestaurantSlug) {
      setStoredSlug(storedRestaurantSlug);
    }
  }, []);

  return (
    <RestaurantContext.Provider value={{ 
      restaurantName, 
      restaurantSlug: restaurantSlug || storedSlug,
      restaurantCode 
    }}>
      {children}
    </RestaurantContext.Provider>
  );
};

export const useRestaurant = () => {
  const context = useContext(RestaurantContext);
  if (context === undefined) {
    throw new Error('useRestaurant must be used within a RestaurantProvider');
  }
  return context;
};
