import React, { useEffect, useState } from "react";
import axios from "axios";
import { Search, Plus, ArrowLeft, AlertCircle } from "lucide-react";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
  isAvailable: boolean;
}

interface CaptainMenuProps {
  onAddToCart: (item: MenuItem) => void;
  onBack: () => void;
}

const CaptainMenu: React.FC<CaptainMenuProps> = ({ onAddToCart, onBack }) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    try {
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const restaurantId = user.restaurantId;

      console.log('[CAPTAIN MENU] User data:', { 
        userId: user.id, 
        username: user.username, 
        restaurantId: user.restaurantId,
        role: user.role 
      });

      if (!restaurantId) {
        console.error('[CAPTAIN MENU] No restaurantId found in user object');
        setError("Restaurant information not found");
        setLoading(false);
        return;
      }

      console.log('[CAPTAIN] Fetching menu for restaurant ID:', restaurantId);
      console.log('[CAPTAIN] Captain user:', user);

      // Use captain-specific endpoint
      const response = await axios.get(
        `${apiUrl}/api/captain/menu/${restaurantId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      console.log('[CAPTAIN] Menu items fetched:', response.data.length);
      console.log('[CAPTAIN] Sample menu item restaurantId:', response.data[0]?.restaurantId);
      console.log('[CAPTAIN] Sample menu item:', response.data[0]);
      const items = response.data || [];
      setMenuItems(items);

      // Extract unique categories
      const uniqueCategories = [
        "All",
        ...Array.from(new Set(items.map((item: MenuItem) => item.category))),
      ];
      setCategories(uniqueCategories);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load menu");
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = menuItems.filter((item) => {
    const matchesCategory =
      selectedCategory === "All" || item.category === selectedCategory;
    const matchesSearch = item.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch && item.isAvailable;
  });

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading menu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center gap-3 text-red-700">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Header */}
      <div className="p-4 border-b">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Tables</span>
        </button>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search menu items..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto mt-4 pb-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`
                px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors
                ${
                  selectedCategory === category
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }
              `}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Items */}
      <div className="p-4 max-h-[calc(100vh-300px)] overflow-y-auto">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No items found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {item.name}
                    </h3>
                    {item.description && (
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                    <p className="text-lg font-bold text-blue-600">
                      ₹{item.price.toFixed(2)}
                    </p>
                  </div>
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded-lg ml-4"
                    />
                  )}
                </div>
                <button
                  onClick={() => onAddToCart(item)}
                  className="w-full mt-3 flex items-center justify-center gap-2 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add to Order
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CaptainMenu;
