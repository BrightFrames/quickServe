import { useState, useEffect } from 'react';
import { menuService, MenuItem, MenuCategory } from '../services/menuService';
import { useRestaurant } from '../context/RestaurantContext';

export const useMenu = () => {
  const [menu, setMenu] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { restaurantSlug, restaurantId } = useRestaurant(); // CORE FIX: Get restaurantId

  const fetchMenu = async () => {
    const CACHE_KEY = `menu_cache_${restaurantSlug || restaurantId || 'default'}`;

    try {
      setLoading(true);
      setError(null);

      // OPTIMISTIC: Load from cache first if available
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        setMenu(JSON.parse(cached));
        setLoading(false); // Show cached data immediately
      }

      // CORE FIX: Pass restaurantId as primary identifier, slug as fallback
      console.log('[USE MENU] Fetching menu - restaurantId:', restaurantId, 'slug:', restaurantSlug);
      const data = await menuService.getMenu(
        restaurantSlug || undefined,
        restaurantId || undefined
      );

      console.log('[USE MENU] Loaded', data.length, 'categories');
      setMenu(data);

      // Update cache
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    } catch (err) {
      console.error('[USE MENU] Error:', err);

      // FALLBACK: If API fails and we haven't loaded cache yet, try to load it now
      // (This handles the case where we didn't use the optimistic cache above or if network fails mid-request)
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        console.log('[USE MENU] Network failed, using cached menu');
        setMenu(JSON.parse(cached));
        // Don't set error if we have cached data
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load menu');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // CORE FIX: Fetch when either restaurantId or slug is available (prefer restaurantId)
    if (restaurantId || restaurantSlug) {
      console.log('[USE MENU] Triggering fetch - restaurantId:', restaurantId, 'slug:', restaurantSlug);
      fetchMenu();
    }

    // Simulate real-time updates
    const interval = setInterval(() => {
      if (restaurantId || restaurantSlug) {
        fetchMenu();
      }
    }, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, [restaurantSlug, restaurantId]); // CORE FIX: Re-fetch when restaurantId changes

  const searchItems = (query: string): MenuItem[] => {
    const lowerQuery = query.toLowerCase();
    return menu.flatMap((category) =>
      category.items.filter(
        (item) =>
          item.name.toLowerCase().includes(lowerQuery) ||
          item.description.toLowerCase().includes(lowerQuery)
      )
    );
  };

  const getItemById = (itemId: string): MenuItem | undefined => {
    return menu.flatMap((category) => category.items).find((item) => item.id === itemId);
  };

  const getRecommendations = (excludeIds: string[] = []): MenuItem[] => {
    const allItems = menu.flatMap((category) => category.items);
    return allItems
      .filter((item) => !excludeIds.includes(item.id) && item.inStock)
      .sort(() => Math.random() - 0.5)
      .slice(0, 4);
  };

  return {
    menu,
    loading,
    error,
    fetchMenu,
    searchItems,
    getItemById,
    getRecommendations,
  };
};
