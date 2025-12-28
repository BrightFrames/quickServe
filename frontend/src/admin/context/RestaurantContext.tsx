import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';

interface RestaurantContextType {
  restaurantName: string | null;
  restaurantSlug: string | null;
  restaurantCode: string | null;
  enableInventory?: boolean;
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

export const RestaurantProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { restaurantSlug } = useParams<{ restaurantSlug: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [restaurantName, setRestaurantName] = useState<string | null>(null);
  const [restaurantCode, setRestaurantCode] = useState<string | null>(null);
  const [storedSlug, setStoredSlug] = useState<string | null>(null);
  const [enableInventory, setEnableInventory] = useState<boolean>(false);

  useEffect(() => {
    // Get restaurant data from localStorage (set by verification page)
    const storedRestaurantName = localStorage.getItem('restaurantName');
    const storedRestaurantCode = localStorage.getItem('restaurantCode');
    const storedRestaurantSlug = localStorage.getItem('restaurantSlug');
    // In a real app, we would fetch settings from API. For now, we default to false or check a local flag/setting.
    // For manual verification, we can toggle this or fetch from restaurant settings if available.
    // Let's assume we fetch settings or just default to true for testing if requested, but plan says flag.
    // We will default to false, but allow it to be set by the new Dashboard logic if needed, or better, 
    // fetch settings. For now, lets add the field to the context.
  }, []);

  return (
    <RestaurantContext.Provider value={{
      restaurantName,
      restaurantSlug: restaurantSlug || storedSlug,
      restaurantCode,
      enableInventory // Expose this
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
