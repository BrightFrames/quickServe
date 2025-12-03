/**
 * Example of optimized React component using React Query
 * This demonstrates best practices for performance
 */

import React, { memo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../config/queryClient';
// import { getMenu } from '../services/menuService'; // Adjust import as needed

interface MenuItem {
  id: number;
  name: string;
  price: number;
  category: string;
  description?: string;
  image?: string;
}

interface MenuItemProps {
  item: MenuItem;
  onAddToCart: (item: MenuItem) => void;
}

// Memoized component - only re-renders when props change
const MenuItemCard = memo<MenuItemProps>(({ item, onAddToCart }) => {
  return (
    <div className="menu-item-card" data-id={item.id}>
      {item.image && (
        <img 
          src={item.image} 
          alt={item.name}
          loading="lazy" // Lazy load images
        />
      )}
      <h3>{item.name}</h3>
      {item.description && <p>{item.description}</p>}
      <div className="price">₹{item.price}</div>
      <button onClick={() => onAddToCart(item)}>
        Add to Cart
      </button>
    </div>
  );
});

MenuItemCard.displayName = 'MenuItemCard';

interface OptimizedMenuListProps {
  restaurantId: number;
  category?: string;
}

/**
 * Optimized Menu List Component
 * - Uses React Query for caching
 * - Memoized child components
 * - Lazy loading images
 * - Efficient re-rendering
 */
export const OptimizedMenuList: React.FC<OptimizedMenuListProps> = ({ 
  restaurantId, 
  category 
}) => {
  // Mock fetch function - replace with actual service
  const fetchMenu = async (): Promise<MenuItem[]> => {
    const response = await fetch(`/api/menu?restaurantId=${restaurantId}`);
    return response.json();
  };

  // React Query handles caching, refetching, and loading states
  const { data: menuItems, isLoading, error } = useQuery({
    queryKey: queryKeys.menu(restaurantId),
    queryFn: fetchMenu,
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 2 * 60 * 60 * 1000, // 2 hours
    refetchOnWindowFocus: true,
  });

  // Memoize filtered items to avoid recalculation
  const filteredItems = React.useMemo(() => {
    if (!menuItems) return [];
    if (!category) return menuItems;
    return menuItems.filter((item: MenuItem) => item.category === category);
  }, [menuItems, category]);

  // Memoize add to cart handler
  const handleAddToCart = React.useCallback((item: MenuItem) => {
    console.log('Adding to cart:', item);
    // Cart logic here
  }, []);

  if (isLoading) {
    return <div>Loading menu...</div>;
  }

  if (error) {
    return <div>Error loading menu</div>;
  }

  return (
    <div className="menu-grid">
      {filteredItems.map((item: MenuItem) => (
        <MenuItemCard 
          key={item.id}
          item={item}
          onAddToCart={handleAddToCart}
        />
      ))}
    </div>
  );
};

// Export memoized version
export default memo(OptimizedMenuList);
