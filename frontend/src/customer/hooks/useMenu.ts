import { useState, useEffect } from 'react';
import { menuService, MenuItem, MenuCategory } from '../services/menuService';
import { useRestaurant } from '../context/RestaurantContext';

export const useMenu = () => {
  const [menu, setMenu] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { restaurantSlug } = useRestaurant();

  const fetchMenu = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await menuService.getMenu(restaurantSlug || undefined);
      setMenu(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load menu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (restaurantSlug) {
      fetchMenu();
    }
    
    // Simulate real-time updates
    const interval = setInterval(() => {
      if (restaurantSlug) {
        fetchMenu();
      }
    }, 60000); // Refresh every minute
    
    return () => clearInterval(interval);
  }, [restaurantSlug]);

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
