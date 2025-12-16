import { useEffect, useState, useRef } from 'react'
import axios from 'axios'
import { AlertTriangle, Package, TrendingDown, Search, ArrowUp, ArrowDown } from 'lucide-react'
import { toast } from 'sonner'
import { notificationSounds } from '../../utils/notificationSounds'
import { useRestaurant } from '../../context/RestaurantContext'

interface InventoryItem {
  id: string
  name: string
  category: string
  inventoryCount: number
  lowStockThreshold: number
  available: boolean
}

const InventoryManagement = () => {
  const { restaurantSlug } = useRestaurant();
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'low'>('all')
  const [searchQuery, setSearchQuery] = useState("")
  const previousLowStockCount = useRef<number>(0)
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'

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
    fetchInventory()
    const interval = setInterval(fetchInventory, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchInventory = async () => {
    try {
      const response = await axios.get(`${apiUrl}/api/menu`, getAxiosConfig())
      const fetchedItems = response.data
      setItems(fetchedItems)

      const lowStockItems = fetchedItems.filter(
        (item: InventoryItem) => item.inventoryCount <= item.lowStockThreshold
      )

      const criticalStockItems = fetchedItems.filter(
        (item: InventoryItem) => item.inventoryCount <= item.lowStockThreshold / 2
      )

      if (lowStockItems.length > previousLowStockCount.current && previousLowStockCount.current > 0) {
        if (criticalStockItems.length > 0) {
          notificationSounds.playCriticalAlert()
          toast.error(`Critical: ${criticalStockItems.length} items critically low!`)
        } else {
          notificationSounds.playLowStockAlert()
          toast.warning(`${lowStockItems.length} items are running low`)
        }
      }
      previousLowStockCount.current = lowStockItems.length
    } catch (error) {
      toast.error('Failed to fetch inventory')
    } finally {
      setLoading(false)
    }
  }

  const updateStock = async (id: string, newCount: number) => {
    try {
      await axios.put(`${apiUrl}/api/menu/${id}/inventory`, { inventoryCount: newCount }, getAxiosConfig())
      toast.success('Stock updated successfully')
      fetchInventory()
    } catch (error) {
      toast.error('Failed to update stock')
    }
  }

  const filteredItems = items.filter((item) => {
    const matchesFilter = filter === 'low' ? item.inventoryCount <= item.lowStockThreshold : true;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const lowStockCount = items.filter(
    (item) => item.inventoryCount <= item.lowStockThreshold
  ).length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Inventory Management</h2>
        <p className="text-sm text-gray-500 mt-1">Track stock levels and manage inventory alerts.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Items</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{items.length}</p>
            </div>
            <div className="p-2 bg-slate-50 rounded-lg">
              <Package className="w-5 h-5 text-slate-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Low Stock Alerts</p>
              <p className={`text-3xl font-bold mt-2 ${lowStockCount > 0 ? 'text-red-600' : 'text-slate-900'}`}>{lowStockCount}</p>
            </div>
            <div className="p-2 bg-red-50 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Unavailable</p>
              <p className="text-3xl font-bold text-gray-400 mt-2">{items.filter(i => !i.available).length}</p>
            </div>
            <div className="p-2 bg-gray-100 rounded-lg">
              <TrendingDown className="w-5 h-5 text-gray-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex space-x-2 w-full md:w-auto">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'all' ? 'bg-slate-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              All Items
            </button>
            <button
              onClick={() => setFilter('low')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${filter === 'low' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Low Stock <span className="bg-white/20 px-1.5 py-0.5 rounded text-xs">{lowStockCount}</span>
            </button>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search inventory..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Item Name</th>
                <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Current Stock</th>
                <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Threshold</th>
                <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-right py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredItems.map((item) => {
                const isLowStock = item.inventoryCount <= item.lowStockThreshold;
                const progressPercentage = Math.min((item.inventoryCount / (item.lowStockThreshold * 3)) * 100, 100);

                return (
                  <tr key={item.id} className={`group hover:bg-gray-50 transition-colors ${isLowStock ? 'bg-red-50/50 hover:bg-red-50' : ''}`}>
                    <td className="py-4 px-6 font-medium text-gray-900">{item.name}</td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={item.inventoryCount}
                          onChange={(e) => {
                            const newValue = parseInt(e.target.value) || 0;
                            setItems(prev => prev.map(i => i.id === item.id ? { ...i, inventoryCount: newValue } : i));
                          }}
                          onBlur={(e) => updateStock(item.id, parseInt(e.target.value) || 0)}
                          className={`w-20 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-slate-900 font-medium ${isLowStock ? 'border-red-300 text-red-900 bg-white' : 'border-gray-300'}`}
                          min="0"
                        />
                        <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${isLowStock ? 'bg-red-500' : 'bg-green-500'}`}
                            style={{ width: `${progressPercentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-gray-500">{item.lowStockThreshold}</td>
                    <td className="py-4 px-6">
                      {isLowStock ? (
                        <div className="flex items-center text-red-600 text-xs font-bold bg-white/50 px-2 py-1 rounded-md border border-red-100 w-fit">
                          <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                          LOW STOCK
                        </div>
                      ) : (
                        <div className="text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded-md border border-green-100 w-fit">
                          IN STOCK
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end space-x-2 opacity-50 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => updateStock(item.id, item.inventoryCount + 10)}
                          className="px-2 py-1 bg-white border border-gray-200 text-gray-600 rounded hover:bg-gray-50 hover:border-gray-300 text-xs font-medium flex items-center gap-1 transition-colors shadow-sm"
                          title="Add 10"
                        >
                          <ArrowUp className="w-3 h-3" /> +10
                        </button>
                        <button
                          onClick={() => updateStock(item.id, item.inventoryCount + 50)}
                          className="px-2 py-1 bg-white border border-gray-200 text-gray-600 rounded hover:bg-gray-50 hover:border-gray-300 text-xs font-medium flex items-center gap-1 transition-colors shadow-sm"
                          title="Add 50"
                        >
                          <ArrowUp className="w-3 h-3" /> +50
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500 text-sm">
                    No inventory items found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default InventoryManagement
