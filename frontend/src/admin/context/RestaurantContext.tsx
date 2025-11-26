import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';

interface RestaurantContextType {
  restaurantId: string | null;
  restaurantName: string | null;
  restaurantSlug: string | null;
  restaurantCode: string | null;
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

export const RestaurantProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { restaurantSlug } = useParams<{ restaurantSlug: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [restaurantName, setRestaurantName] = useState<string | null>(null);
  const [restaurantCode, setRestaurantCode] = useState<string | null>(null);

  useEffect(() => {
    // Get restaurant data from localStorage (set by verification page)
    const storedRestaurantId = localStorage.getItem('restaurantId');
    const storedRestaurantName = localStorage.getItem('restaurantName');
    const storedRestaurantCode = localStorage.getItem('restaurantCode');
    
    if (storedRestaurantId && storedRestaurantName && storedRestaurantCode) {
      setRestaurantId(storedRestaurantId);
      setRestaurantName(storedRestaurantName);
      setRestaurantCode(storedRestaurantCode);
    }
  }, []);

  return (
    <RestaurantContext.Provider value={{ 
      restaurantId, 
      restaurantName, 
      restaurantSlug: restaurantSlug || null,
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
