import React, { createContext, useContext, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

interface RestaurantContextType {
  restaurantName: string | null;
  restaurantSlug: string | null;
  token: string | null;
  setRestaurantData: (data: { restaurantName: string; restaurantSlug: string; token: string }) => void;
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

export const RestaurantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [restaurantName, setRestaurantName] = useState<string | null>(null);
  const [restaurantSlug, setRestaurantSlug] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const { restaurantSlug: urlSlug } = useParams();
  const navigate = useNavigate();

  // Load restaurant data from URL params or localStorage on mount
  useEffect(() => {
    // Check URL parameters first
    const urlParams = new URLSearchParams(window.location.search);
    const paramRestaurantName = urlParams.get('restaurantName');
    const paramToken = urlParams.get('token');

    if (paramRestaurantName && paramToken && urlSlug) {
      // Store in state and localStorage
      const restaurantData = {
        restaurantName: paramRestaurantName,
        restaurantSlug: urlSlug,
        token: paramToken,
      };
      
      setRestaurantName(paramRestaurantName);
      setRestaurantSlug(urlSlug);
      setToken(paramToken);
      
      localStorage.setItem('customer_restaurant_data', JSON.stringify(restaurantData));
      
      // Clean URL by removing query params
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
    } else {
      // Try to load from localStorage
      const savedData = localStorage.getItem('customer_restaurant_data');
      if (savedData) {
        const data = JSON.parse(savedData);
        setRestaurantName(data.restaurantName);
        setRestaurantSlug(data.restaurantSlug);
        setToken(data.token);
        
        // Redirect to correct slug if different
        if (urlSlug && urlSlug !== data.restaurantSlug) {
          navigate(`/${data.restaurantSlug}/customer/menu/table/t1`, { replace: true });
        }
      }
    }
  }, [urlSlug, navigate]);

  const setRestaurantData = (data: { restaurantName: string; restaurantSlug: string; token: string }) => {
    setRestaurantName(data.restaurantName);
    setRestaurantSlug(data.restaurantSlug);
    setToken(data.token);
    localStorage.setItem('customer_restaurant_data', JSON.stringify(data));
  };

  return (
    <RestaurantContext.Provider
      value={{
        restaurantName,
        restaurantSlug,
        token,
        setRestaurantData,
      }}
    >
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
