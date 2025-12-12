import React, { createContext, useContext, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

interface RestaurantContextType {
  restaurantId: number | null; // CORE FIX: Add restaurantId as primary identifier
  restaurantName: string | null;
  restaurantSlug: string | null;
  token: string | null;
  setRestaurantData: (data: { 
    restaurantId: number; 
    restaurantName: string; 
    restaurantSlug: string; 
    token: string 
  }) => void;
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

export const RestaurantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [restaurantId, setRestaurantId] = useState<number | null>(null); // CORE FIX: Store restaurantId
  const [restaurantName, setRestaurantName] = useState<string | null>(null);
  const [restaurantSlug, setRestaurantSlug] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const { restaurantSlug: urlSlug } = useParams();
  const navigate = useNavigate();

  // Load restaurant data from URL params or localStorage on mount
  useEffect(() => {
    // Check if in captain mode first
    const captainData = localStorage.getItem('customer_restaurant_data');
    if (captainData) {
      const data = JSON.parse(captainData);
      setRestaurantId(data.restaurantId || null); // CORE FIX: Load restaurantId
      setRestaurantName(data.restaurantName);
      setRestaurantSlug(data.restaurantSlug);
      setToken(data.token);
      console.log('[RESTAURANT CONTEXT] Loaded from storage - restaurantId:', data.restaurantId);
      return; // Skip URL validation in captain mode
    }
    
    // Check URL parameters first
    const urlParams = new URLSearchParams(window.location.search);
    const paramRestaurantName = urlParams.get('restaurantName');
    const paramRestaurantId = urlParams.get('restaurantId'); // CORE FIX: Get restaurantId from URL
    const paramToken = urlParams.get('token');

    if (paramRestaurantName && paramToken && urlSlug) {
      // Store in state and localStorage
      const restaurantData = {
        restaurantId: paramRestaurantId ? parseInt(paramRestaurantId, 10) : null, // CORE FIX: Parse and store
        restaurantName: paramRestaurantName,
        restaurantSlug: urlSlug,
        token: paramToken,
      };
      
      setRestaurantId(restaurantData.restaurantId);
      setRestaurantName(paramRestaurantName);
      setRestaurantSlug(urlSlug);
      setToken(paramToken);
      
      localStorage.setItem('customer_restaurant_data', JSON.stringify(restaurantData));
      console.log('[RESTAURANT CONTEXT] Stored from URL - restaurantId:', restaurantData.restaurantId);
      
      // Clean URL by removing query params
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
    } else if (urlSlug) {
      // QR CODE FLOW: Customer scanned QR code with URL like /menu/udita-bestro/table/T1
      // The slug is in the URL but no query params - this is the normal customer flow
      console.log('[RESTAURANT CONTEXT] ✓ QR code scan detected!');
      console.log('[RESTAURANT CONTEXT]   URL slug:', urlSlug);
      console.log('[RESTAURANT CONTEXT]   Full path:', window.location.pathname);
      setRestaurantSlug(urlSlug);
      // Note: restaurantId will be null, but menuService.getMenu will fetch by slug from public API
    } else {
      // Try to load from localStorage
      const savedData = localStorage.getItem('customer_restaurant_data');
      if (savedData) {
        const data = JSON.parse(savedData);
        setRestaurantId(data.restaurantId || null); // CORE FIX: Load restaurantId
        setRestaurantName(data.restaurantName);
        setRestaurantSlug(data.restaurantSlug);
        setToken(data.token);
        console.log('[RESTAURANT CONTEXT] Restored from storage - restaurantId:', data.restaurantId);
        
        // Redirect to correct slug if different
        if (urlSlug && urlSlug !== data.restaurantSlug) {
          navigate(`/${data.restaurantSlug}/customer/menu/table/t1`, { replace: true });
        }
      }
    }
  }, [urlSlug, navigate]);

  const setRestaurantData = (data: { 
    restaurantId: number; 
    restaurantName: string; 
    restaurantSlug: string; 
    token: string 
  }) => {
    console.log('[RESTAURANT CONTEXT] Setting restaurant data - restaurantId:', data.restaurantId);
    setRestaurantId(data.restaurantId); // CORE FIX: Store restaurantId
    setRestaurantName(data.restaurantName);
    setRestaurantSlug(data.restaurantSlug);
    setToken(data.token);
    localStorage.setItem('customer_restaurant_data', JSON.stringify(data));
  };

  return (
    <RestaurantContext.Provider
      value={{
        restaurantId, // CORE FIX: Expose restaurantId
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
