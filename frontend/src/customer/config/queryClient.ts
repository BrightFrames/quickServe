import { QueryClient } from '@tanstack/react-query';

// Configure React Query with optimized settings for performance
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache menu and restaurant data aggressively (1 hour)
      staleTime: 60 * 60 * 1000, // 1 hour
      gcTime: 2 * 60 * 60 * 1000, // 2 hours (formerly cacheTime)
      
      // Retry failed requests
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Refetch on window focus for fresh data
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      refetchOnReconnect: true,
      
      // Network mode for offline support
      networkMode: 'online',
      
      // Structural sharing for performance
      structuralSharing: true,
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
      retryDelay: 1000,
      
      // Network mode
      networkMode: 'online',
    },
  },
});

// Query keys for consistent cache management
export const queryKeys = {
  restaurant: (slug: string) => ['restaurant', slug] as const,
  menu: (restaurantId: number | string) => ['menu', restaurantId] as const,
  categories: (restaurantId: number | string) => ['categories', restaurantId] as const,
  order: (orderId: string) => ['order', orderId] as const,
  orders: (restaurantId: number | string) => ['orders', restaurantId] as const,
  cart: () => ['cart'] as const,
};
