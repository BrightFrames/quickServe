import { useEffect, useState } from "react";
import axios from "axios";
import { Plus, Edit, Trash2, Save, X, Search, Filter } from "lucide-react";
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
  const [searchQuery, setSearchQuery] = useState("");
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

  const getAxiosConfig = () => {
    const token = localStorage.getItem('token') || localStorage.getItem('restaurantToken');
    return {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-restaurant-slug': restaurantSlug || '',
      }
    };
  };

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

  const filteredMenuItems = menuItems.filter((item) => {
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!restaurantSlug) {
      toast.error("Restaurant slug is missing. Please login again.");
      return;
    }

    try {
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
      console.error('[MENU] Error saving menu item:', error);
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
      const slug = restaurantSlug || localStorage.getItem('restaurantSlug');
      if (!slug) return;
      await axios.put(`${apiUrl}/api/menu/${item.id}?slug=${slug}`, {
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
      const slug = restaurantSlug || localStorage.getItem('restaurantSlug');
      if (!slug) return;
      await axios.put(`/api/menu/${id}/inventory?slug=${slug}`, { inventoryCount: count });
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Menu Management</h2>
          <p className="text-sm text-gray-500 mt-1">Manage your restaurant's food and beverage offerings.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center justify-center space-x-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Item</span>
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full md:w-48 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none bg-white cursor-pointer"
            >
              <option value="all">All Categories</option>
              {MENU_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Desktop Table View - Hidden on Mobile */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Item Details</th>
                <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</th>
                <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Inventory</th>
                <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-right py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredMenuItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden border border-gray-200">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Img</div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 flex items-center gap-2">
                          {item.name}
                          <span className={`w-2 h-2 rounded-full ${item.isVegetarian ? 'bg-green-500' : 'bg-red-500'}`} title={item.isVegetarian ? "Veg" : "Non-Veg"}></span>
                        </div>
                        <div className="text-sm text-gray-500 line-clamp-1 max-w-[200px]" title={item.description}>
                          {item.description}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                      {item.category}
                    </span>
                  </td>
                  <td className="py-4 px-6 font-medium text-gray-900">
                    {formatCurrency(item.price)}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={item.inventoryCount || ""}
                        onChange={(e) => updateInventory(item.id!, parseInt(e.target.value) || 0)}
                        className={`w-16 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-slate-900 ${item.inventoryCount <= item.lowStockThreshold ? 'border-red-300 bg-red-50 text-red-900' : 'border-gray-300'}`}
                      />
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <button
                      onClick={() => toggleAvailability(item)}
                      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${item.available ? 'bg-green-500' : 'bg-gray-200'}`}
                    >
                      <span className="sr-only">Toggle availability</span>
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${item.available ? 'translate-x-4' : 'translate-x-0'}`}
                      />
                    </button>
                    <span className="ml-2 text-sm text-gray-500">{item.available ? 'Active' : 'Inactive'}</span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex justify-end space-x-2">
                      <button onClick={() => startEdit(item)} className="p-1 text-gray-400 hover:text-blue-600 border border-gray-200 rounded hover:border-blue-200 transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(item.id!)} className="p-1 text-gray-400 hover:text-red-600 border border-gray-200 rounded hover:border-red-200 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredMenuItems.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500 text-sm">
                    No items found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View - Shown on Mobile Only */}
      <div className="md:hidden space-y-4">
        {filteredMenuItems.map((item) => (
          <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-4">
            {/* Item Header with Image */}
            <div className="flex gap-4">
              <div className="w-20 h-20 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden border border-gray-200">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Image</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-gray-900 flex items-center gap-2 mb-1">
                  {item.name}
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${item.isVegetarian ? 'bg-green-500' : 'bg-red-500'}`} title={item.isVegetarian ? "Veg" : "Non-Veg"}></span>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2 mb-2">{item.description}</p>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                    {item.category}
                  </span>
                  <span className="font-bold text-gray-900">{formatCurrency(item.price)}</span>
                </div>
              </div>
            </div>

            {/* Item Details Grid */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Inventory</label>
                <input
                  type="number"
                  value={item.inventoryCount || ""}
                  onChange={(e) => updateInventory(item.id!, parseInt(e.target.value) || 0)}
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 ${item.inventoryCount <= item.lowStockThreshold ? 'border-red-300 bg-red-50 text-red-900' : 'border-gray-300'}`}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Status</label>
                <button
                  onClick={() => toggleAvailability(item)}
                  className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors ${item.available ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}
                >
                  {item.available ? 'Available' : 'Unavailable'}
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => startEdit(item)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={() => handleDelete(item.id!)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors font-medium"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        ))}
        {filteredMenuItems.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">
            No items found matching your filters.
          </div>
        )}
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900">
                {editingItem ? "Edit Menu Item" : "Add New Item"}
              </h3>
              <button onClick={resetForm} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Item Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none bg-white"
                    required
                  >
                    <option value="" disabled>Select Category</option>
                    {MENU_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none"
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Price (₹)</label>
                  <input
                    type="number"
                    value={formData.price || ""}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Image URL</label>
                  <input
                    type="text"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Dietary Type</label>
                <div className="flex gap-4">
                  <label className={`flex-1 flex items-center justify-center gap-2 p-3 border rounded-lg cursor-pointer transition-all ${formData.isVegetarian ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input
                      type="radio"
                      name="isVegetarian"
                      checked={formData.isVegetarian === true}
                      onChange={() => setFormData({ ...formData, isVegetarian: true })}
                      className="hidden"
                    />
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    <span className="font-medium">Vegetarian</span>
                  </label>
                  <label className={`flex-1 flex items-center justify-center gap-2 p-3 border rounded-lg cursor-pointer transition-all ${!formData.isVegetarian ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input
                      type="radio"
                      name="isVegetarian"
                      checked={formData.isVegetarian === false}
                      onChange={() => setFormData({ ...formData, isVegetarian: false })}
                      className="hidden"
                    />
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    <span className="font-medium">Non-Vegetarian</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Initial Inventory</label>
                  <input
                    type="number"
                    value={formData.inventoryCount || ""}
                    onChange={(e) => setFormData({ ...formData, inventoryCount: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none"
                    min="0"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Low Stock Alert At</label>
                  <input
                    type="number"
                    value={formData.lowStockThreshold || ""}
                    onChange={(e) => setFormData({ ...formData, lowStockThreshold: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none"
                    min="0"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="available"
                  checked={formData.available}
                  onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                  className="w-4 h-4 text-slate-900 rounded border-gray-300 focus:ring-slate-900"
                />
                <label htmlFor="available" className="text-sm text-gray-700">
                  Immediately available for orders
                </label>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {editingItem ? "Update Item" : "Create Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuManagement;
