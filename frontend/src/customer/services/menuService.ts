import axios from "axios";

export interface MenuItem {
  id: string;
  _id?: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  inStock: boolean;
  available?: boolean;
  inventoryCount?: number;
  variants?: { name: string; price: number }[];
  addOns?: { name: string; price: number }[];
  isVegetarian?: boolean;
  isVegan?: boolean;
  spicyLevel?: number;
  averageRating?: number;
  totalRatings?: number;
}

export interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  items: MenuItem[];
}

class MenuService {
  private getBaseUrl() {
    // Check environment variable first
    if (import.meta.env.VITE_API_URL) {
      return import.meta.env.VITE_API_URL;
    }
    // Runtime detection - if on Vercel (production), use Render backend
    if (window.location.hostname.includes('vercel.app')) {
      return 'https://quickserve-51ek.onrender.com';
    }
    // Local development
    return 'http://localhost:3000';
  }
  
  private get apiUrl() {
    return `${this.getBaseUrl()}/api/menu`;
  }

  /**
   * PUBLIC CUSTOMER ENDPOINT - No authentication required
   * Fetch menu data directly for customers scanning QR codes
   * @param restaurantSlug - Restaurant slug from QR code URL (REQUIRED for customers)
   * @param restaurantId - Restaurant ID (optional, for backward compatibility)
   */
  async getMenu(restaurantSlug?: string, restaurantId?: number): Promise<MenuCategory[]> {
    try {
      // For customers scanning QR codes - use PUBLIC endpoint
      // This bypasses ALL authentication and slug verification
      if (restaurantSlug) {
        const publicUrl = `${this.getBaseUrl()}/public/menu/${restaurantSlug}`;
        console.log('[MENU SERVICE] PUBLIC customer request for slug:', restaurantSlug);
        console.log('[MENU SERVICE] Using public endpoint:', publicUrl);
        
        const response = await axios.get(publicUrl);
        const { restaurant, menu: menuItems } = response.data;
        
        console.log('[MENU SERVICE] PUBLIC - Restaurant:', restaurant.name);
        console.log('[MENU SERVICE] PUBLIC - Retrieved', menuItems.length, 'items');
        
        // Group items by category
        const categoriesMap = new Map<string, MenuItem[]>();

        menuItems.forEach((item: any) => {
          const category = item.category || "Other";
          if (!categoriesMap.has(category)) {
            categoriesMap.set(category, []);
          }

          // Map backend data to frontend format
          const mappedItem: MenuItem = {
            id: item.id?.toString() || item._id?.toString(),
            _id: item._id,
            name: item.name,
            description: item.description,
            price: item.price,
            image: item.image,
            category: item.category,
            inStock: item.available !== false,
            available: item.available,
            inventoryCount: item.inventoryCount,
            isVegetarian: item.isVegetarian,
            averageRating: item.averageRating,
            totalRatings: item.totalRatings,
          };

          categoriesMap.get(category)!.push(mappedItem);
        });

        // Convert map to array of categories
        const categories: MenuCategory[] = Array.from(
          categoriesMap.entries()
        ).map(([categoryName, items]) => ({
          id: categoryName.toLowerCase().replace(/\s+/g, "-"),
          name: categoryName,
          description: `Delicious ${categoryName.toLowerCase()}`,
          items,
        }));

        return categories;
      }
      
      // Fallback for old admin flow (restaurantId) - keep existing functionality
      // This ensures admin/staff dashboards still work correctly
      let url = this.apiUrl;
      if (restaurantId && restaurantId > 0) {
        url = `${this.apiUrl}?restaurantId=${restaurantId}`;
        console.log('[MENU SERVICE] Admin request by restaurantId:', restaurantId);
      }
      
      const response = await axios.get(url);
      const menuItems: MenuItem[] = response.data;
      console.log(`[MENU SERVICE] Retrieved ${menuItems.length} items`);

      // Group items by category (same logic as above)
      const categoriesMap = new Map<string, MenuItem[]>();

      menuItems.forEach((item) => {
        const category = item.category || "Other";
        if (!categoriesMap.has(category)) {
          categoriesMap.set(category, []);
        }

        const mappedItem: MenuItem = {
          id: item._id || item.id,
          _id: item._id,
          name: item.name,
          description: item.description,
          price: item.price,
          image: item.image,
          category: item.category,
          inStock: item.available !== false && (item.inventoryCount || 0) > 0,
          available: item.available,
          inventoryCount: item.inventoryCount,
          isVegetarian: item.isVegetarian,
          averageRating: item.averageRating,
          totalRatings: item.totalRatings,
        };

        categoriesMap.get(category)!.push(mappedItem);
      });

      const categories: MenuCategory[] = Array.from(
        categoriesMap.entries()
      ).map(([categoryName, items]) => ({
        id: categoryName.toLowerCase().replace(/\s+/g, "-"),
        name: categoryName,
        description: `Delicious ${categoryName.toLowerCase()}`,
        items,
      }));

      return categories;
    } catch (error) {
      console.error("Error fetching menu:", error);
      // Return empty array on error
      return [];
    }
  }

  async getMenuByCategory(categoryId: string): Promise<MenuCategory | null> {
    const menu = await this.getMenu();
    return menu.find((cat) => cat.id === categoryId) || null;
  }

  async getItemById(itemId: string): Promise<MenuItem | null> {
    try {
      const menu = await this.getMenu();
      for (const category of menu) {
        const item = category.items.find(
          (i) => i.id === itemId || i._id === itemId
        );
        if (item) return item;
      }
      return null;
    } catch (error) {
      console.error("Error fetching item:", error);
      return null;
    }
  }
}

export const menuService = new MenuService();
