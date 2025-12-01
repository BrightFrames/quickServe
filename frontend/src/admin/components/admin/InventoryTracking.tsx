import React, { useEffect, useState } from "react";
import axios from "axios";
import { Package, TrendingDown, Calendar, AlertTriangle, BarChart3 } from "lucide-react";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

interface ItemConsumption {
  itemId: number;
  itemName: string;
  totalQuantity: number;
  category: string;
  price: number;
  totalRevenue: number;
}

interface DailyConsumption {
  date: string;
  items: {
    itemName: string;
    quantity: number;
    revenue: number;
  }[];
  totalOrders: number;
  totalRevenue: number;
}

const InventoryTracking: React.FC = () => {
  const [consumptionData, setConsumptionData] = useState<ItemConsumption[]>([]);
  const [dailyData, setDailyData] = useState<DailyConsumption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<number>(7);

  useEffect(() => {
    fetchInventoryData();
  }, [selectedPeriod]);

  const fetchInventoryData = async () => {
    try {
      const token = localStorage.getItem("token");
      
      const response = await axios.get(
        `${apiUrl}/api/analytics/inventory-consumption?days=${selectedPeriod}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setConsumptionData(response.data.itemConsumption || []);
      setDailyData(response.data.dailyConsumption || []);
    } catch (err) {
      console.error("[INVENTORY] Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const totalRevenue = consumptionData.reduce((sum, item) => sum + item.totalRevenue, 0);
  const totalItems = consumptionData.reduce((sum, item) => sum + item.totalQuantity, 0);
  const topItems = [...consumptionData].sort((a, b) => b.totalQuantity - a.totalQuantity).slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading inventory data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Package className="w-8 h-8 text-blue-600" />
            Inventory Consumption Tracking
          </h2>
          <p className="text-gray-600 mt-1">Track item usage and consumption patterns</p>
        </div>
        
        <div className="flex gap-2">
          {[7, 14, 30].map(days => (
            <button
              key={days}
              onClick={() => setSelectedPeriod(days)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedPeriod === days
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {days} Days
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-blue-100 font-medium">Total Items Sold</h3>
            <Package className="w-8 h-8 text-blue-200" />
          </div>
          <p className="text-4xl font-bold">{totalItems}</p>
          <p className="text-blue-100 text-sm mt-2">Last {selectedPeriod} days</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-green-100 font-medium">Total Revenue</h3>
            <BarChart3 className="w-8 h-8 text-green-200" />
          </div>
          <p className="text-4xl font-bold">₹{totalRevenue.toFixed(2)}</p>
          <p className="text-green-100 text-sm mt-2">From inventory sales</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-purple-100 font-medium">Unique Items</h3>
            <TrendingDown className="w-8 h-8 text-purple-200" />
          </div>
          <p className="text-4xl font-bold">{consumptionData.length}</p>
          <p className="text-purple-100 text-sm mt-2">Items consumed</p>
        </div>
      </div>

      {/* Top Selling Items */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingDown className="w-6 h-6 text-orange-600" />
          Top 5 Most Consumed Items
        </h3>
        <div className="space-y-3">
          {topItems.map((item, index) => (
            <div
              key={item.itemId}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center font-bold text-white
                  ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-600' : 'bg-blue-500'}
                `}>
                  {index + 1}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{item.itemName}</h4>
                  <p className="text-sm text-gray-600">{item.category}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">{item.totalQuantity}</p>
                <p className="text-sm text-gray-600">₹{item.totalRevenue.toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* All Items Consumption Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="w-6 h-6 text-blue-600" />
            Complete Inventory Consumption Report
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity Sold
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit Price
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Revenue
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {consumptionData.map((item) => (
                <tr key={item.itemId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{item.itemName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                      {item.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className="text-lg font-semibold text-gray-900">{item.totalQuantity}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-gray-600">
                    ₹{item.price.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className="text-lg font-bold text-green-600">
                      ₹{item.totalRevenue.toFixed(2)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 border-t-2 border-gray-300">
              <tr>
                <td colSpan={2} className="px-6 py-4 text-right font-bold text-gray-900">
                  TOTAL
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="text-xl font-bold text-blue-600">{totalItems}</span>
                </td>
                <td className="px-6 py-4"></td>
                <td className="px-6 py-4 text-right">
                  <span className="text-xl font-bold text-green-600">₹{totalRevenue.toFixed(2)}</span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Daily Breakdown */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="w-6 h-6 text-indigo-600" />
          Daily Consumption Breakdown
        </h3>
        <div className="space-y-4">
          {dailyData.map((day) => (
            <div key={day.date} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900">
                  {new Date(day.date).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </h4>
                <div className="text-right">
                  <p className="text-sm text-gray-600">{day.totalOrders} orders</p>
                  <p className="font-bold text-green-600">₹{day.totalRevenue.toFixed(2)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {day.items.map((item, idx) => (
                  <div key={idx} className="bg-gray-50 rounded px-3 py-2 text-sm">
                    <span className="font-medium text-gray-900">{item.itemName}</span>
                    <span className="text-gray-600 ml-2">×{item.quantity}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {consumptionData.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
          <p className="text-yellow-700 font-medium mb-2">No Consumption Data</p>
          <p className="text-yellow-600 text-sm">
            No orders found in the selected period
          </p>
        </div>
      )}
    </div>
  );
};

export default InventoryTracking;
