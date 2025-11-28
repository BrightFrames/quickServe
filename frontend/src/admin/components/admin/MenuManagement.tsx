import { useEffect, useState } from "react";
import axios from "axios";
import { Plus, Edit, Trash2, Save, X } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from '@/shared/lib/utils';
import { useRestaurant } from "../../context/RestaurantContext";

interface MenuItem {
  id?: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  available: boolean;
  inventoryCount: number;
  lowStockThreshold: number;
  isVegetarian: boolean;
}

// Predefined categories
const MENU_CATEGORIES = [
  "Chinese",
  "Beverages",
  "Main Course",
  "Snacks",
  "Restaurant Special",
] as const;

const MenuManagement = () => {
  const { restaurantSlug } = useRestaurant();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [formData, setFormData] = useState<MenuItem>({
    name: "",
    description: "",
    price: 0,
    category: "",
    image: "",
    available: true,
    inventoryCount: 0,
    lowStockThreshold: 5,
    isVegetarian: true,
  });

  // Helper to get axios config with restaurant slug header
  const getAxiosConfig = () => ({
    headers: {
      'x-restaurant-slug': restaurantSlug || '',
    }
  });

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      const response = await axios.get(`${apiUrl}/api/menu`, getAxiosConfig());
      setMenuItems(response.data);
    } catch (error) {
      console.error('Error fetching menu items:', error);
      toast.error("Failed to fetch menu items");
    } finally {
      setLoading(false);
    }
  };

  // Filter menu items by category
  const filteredMenuItems =
    selectedCategory === "all"
      ? menuItems
      : menuItems.filter((item) => item.category === selectedCategory);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!restaurantSlug) {
      toast.error("Restaurant slug is missing. Please login again.");
      return;
    }
    
    try {
      const menuData = { ...formData, slug: restaurantSlug };
      
      if (editingItem?.id) {
        await axios.put(`${apiUrl}/api/menu/${editingItem.id}`, formData, getAxiosConfig());
        toast.success("Menu item updated successfully");
      } else {
        await axios.post(`${apiUrl}/api/menu`, formData, getAxiosConfig());
        toast.success("Menu item added successfully");
      }
      fetchMenuItems();
      resetForm();
    } catch (error: any) {
      console.error('Error saving menu item:', error);
      toast.error(error.response?.data?.message || "Failed to save menu item");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      await axios.delete(`${apiUrl}/api/menu/${id}`, getAxiosConfig());
      toast.success("Menu item deleted successfully");
      fetchMenuItems();
    } catch (error) {
      toast.error("Failed to delete menu item");
    }
  };

  const toggleAvailability = async (item: MenuItem) => {
    try {
      await axios.put(`${apiUrl}/api/menu/${item.id}`, {
        ...item,
        available: !item.available,
      });
      toast.success(`Item ${!item.available ? "enabled" : "disabled"}`);
      fetchMenuItems();
    } catch (error) {
      toast.error("Failed to update availability");
    }
  };

  const updateInventory = async (id: string, count: number) => {
    try {
      await axios.put(`/api/menu/${id}/inventory`, { inventoryCount: count });
      toast.success("Inventory updated");
      fetchMenuItems();
    } catch (error) {
      toast.error("Failed to update inventory");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: 0,
      category: "",
      image: "",
      available: true,
      inventoryCount: 0,
      lowStockThreshold: 5,
      isVegetarian: true,
    });
    setEditingItem(null);
    setShowForm(false);
  };

  const startEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormData(item);
    setShowForm(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Menu Items</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          <span>Add New Item</span>
        </button>
      </div>

      {/* Category Filter */}
      <div className="bg-white rounded-lg shadow p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Filter by Category
        </label>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full md:w-64 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="all">All Categories</option>
          {MENU_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        <p className="text-sm text-gray-500 mt-2">
          Showing {filteredMenuItems.length} of {menuItems.length} items
        </p>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">
                {editingItem ? "Edit Menu Item" : "Add New Menu Item"}
              </h3>
              <button
                onClick={resetForm}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Item Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 cursor-pointer appearance-none"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
                      backgroundPosition: "right 0.5rem center",
                      backgroundRepeat: "no-repeat",
                      backgroundSize: "1.5em 1.5em",
                      paddingRight: "2.5rem",
                    }}
                    required
                  >
                    <option value="" disabled>
                      -- Select a category --
                    </option>
                    {MENU_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.price || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        price: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image URL
                  </label>
                  <input
                    type="text"
                    value={formData.image}
                    onChange={(e) =>
                      setFormData({ ...formData, image: e.target.value })
                    }
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Food Type <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-4">
                  <label className="flex-1 cursor-pointer">
                    <div
                      className={`flex items-center justify-center space-x-3 p-4 border-2 rounded-lg transition-all ${
                        formData.isVegetarian === true
                          ? "border-green-500 bg-green-50"
                          : "border-gray-300 bg-white hover:border-green-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="isVegetarian"
                        checked={formData.isVegetarian === true}
                        onChange={() =>
                          setFormData({ ...formData, isVegetarian: true })
                        }
                        className="w-4 h-4 text-green-600 cursor-pointer"
                      />
                      <span className="font-medium text-gray-900 flex items-center">
                        <span className="text-green-600 text-2xl mr-2">●</span>
                        Vegetarian
                      </span>
                    </div>
                  </label>
                  <label className="flex-1 cursor-pointer">
                    <div
                      className={`flex items-center justify-center space-x-3 p-4 border-2 rounded-lg transition-all ${
                        formData.isVegetarian === false
                          ? "border-red-500 bg-red-50"
                          : "border-gray-300 bg-white hover:border-red-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="isVegetarian"
                        checked={formData.isVegetarian === false}
                        onChange={() =>
                          setFormData({ ...formData, isVegetarian: false })
                        }
                        className="w-4 h-4 text-red-600 cursor-pointer"
                      />
                      <span className="font-medium text-gray-900 flex items-center">
                        <span className="text-red-600 text-2xl mr-2">●</span>
                        Non-Vegetarian
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Inventory Count
                  </label>
                  <input
                    type="number"
                    value={formData.inventoryCount || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        inventoryCount: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="0"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Low Stock Threshold
                  </label>
                  <input
                    type="number"
                    value={formData.lowStockThreshold || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        lowStockThreshold: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="0"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.available}
                  onChange={(e) =>
                    setFormData({ ...formData, available: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600"
                />
                <label className="ml-2 text-sm text-gray-700">
                  Available for orders
                </label>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                >
                  <Save className="w-5 h-5 inline mr-2" />
                  {editingItem ? "Update" : "Add"} Item
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Menu Items Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr key="header-row">
              <th className="text-left py-3 px-4 font-semibold text-gray-700">
                Item
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">
                Type
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">
                Category
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">
                Price
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">
                Inventory
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">
                Status
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredMenuItems.map((item) => (
              <tr key={item.id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4">
                  <div className="flex items-center space-x-3">
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-12 h-12 rounded object-cover"
                      />
                    )}
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-gray-500">
                        {item.description}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`text-2xl ${
                      item.isVegetarian ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    ●
                  </span>
                </td>
                <td className="py-3 px-4">{item.category}</td>
                <td className="py-3 px-4 font-semibold">
                  {formatCurrency(item.price)}
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={item.inventoryCount || ""}
                      onChange={(e) =>
                        updateInventory(item.id!, parseInt(e.target.value) || 0)
                      }
                      className="w-20 px-2 py-1 border rounded"
                      min="0"
                    />
                    {item.inventoryCount <= item.lowStockThreshold && (
                      <span className="text-red-600 text-xs font-semibold">
                        Low Stock!
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <button
                    onClick={() => toggleAvailability(item)}
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      item.available
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {item.available ? "Available" : "Unavailable"}
                  </button>
                </td>
                <td className="py-3 px-4">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => startEdit(item)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id!)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MenuManagement;
