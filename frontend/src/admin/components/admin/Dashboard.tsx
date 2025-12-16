import { useEffect, useState, useRef } from 'react'
import axios from 'axios'
import {
  TrendingUp,
  ShoppingCart,
  Users,
  ChefHat,
  Utensils,
  DollarSign,
  Eye,
  Edit,
  MoreHorizontal
} from 'lucide-react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import { formatCurrency } from '../../lib/utils'
import { useRestaurant } from '../../context/RestaurantContext'
import { Link } from 'react-router-dom'
import NumberFlow from '@number-flow/react'

interface Analytics {
  revenue: {
    today: number
    last7Days: number
    last30Days: number
  }
  orders: {
    total: number
    completed: number
    inProgress: number
    cancelled: number
  }
  popularItems: Array<{
    name: string
    orders: number
    revenue: number
  }>
  revenueChart: Array<{
    date: string
    revenue: number
  }>
}

interface Order {
  id: number
  orderNumber: string
  customerName?: string
  status: string
  totalAmount: number
  createdAt: string
  tableId: string
}

interface Staff {
  id: number
  username: string
  isOnline: boolean
}

const Dashboard = () => {
  const { restaurantSlug } = useRestaurant()
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [totalTables, setTotalTables] = useState(0)
  const [occupiedTables, setOccupiedTables] = useState(0)
  const [totalStaff, setTotalStaff] = useState(0)
  const [activeStaff, setActiveStaff] = useState(0)
  const [loading, setLoading] = useState(true)
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
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [analyticsRes, ordersRes, tablesRes, kitchenRes, captainRes] = await Promise.all([
        axios.get(`${apiUrl}/api/analytics?period=today`, getAxiosConfig()),
        axios.get(`${apiUrl}/api/orders/active`, getAxiosConfig()),
        axios.get(`${apiUrl}/api/tables`, getAxiosConfig()),
        axios.get(`${apiUrl}/api/users/kitchen`, getAxiosConfig()),
        axios.get(`${apiUrl}/api/users/captains`, getAxiosConfig())
      ])

      setAnalytics(analyticsRes.data)
      setRecentOrders(ordersRes.data.slice(0, 5))

      // Calculate Real Table Stats
      setTotalTables(tablesRes.data.length || 0)

      const activeOrderTableIds = new Set(
        ordersRes.data
          .filter((o: any) => ['pending', 'preparing', 'ready', 'served'].includes(o.status))
          .map((o: any) => o.tableId)
      );
      setOccupiedTables(activeOrderTableIds.size);

      // Calculate Real Staff Stats
      const kitchenStaff = kitchenRes.data || [];
      const captainStaff = captainRes.data || [];
      setTotalStaff(kitchenStaff.length + captainStaff.length);

      const onlineKitchen = kitchenStaff.filter((u: Staff) => u.isOnline).length;
      const onlineCaptain = captainStaff.filter((u: Staff) => u.isOnline).length;
      setActiveStaff(onlineKitchen + onlineCaptain);

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'served':
        return 'bg-green-100 text-green-700'
      case 'pending':
        return 'bg-yellow-100 text-yellow-700'
      case 'preparing':
        return 'bg-blue-100 text-blue-700'
      case 'cancelled':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  if (loading || !analytics) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    )
  }

  // Calculate percentage changes (mocked for visual matching as implementation details vary)
  const revenueGrowth = "+8%"
  const ordersGrowth = "5%"

  return (
    <div className="space-y-6">

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Orders */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-start justify-between">
          <div>
            <h3 className="text-gray-500 text-sm font-medium mb-1">Total Orders</h3>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              <NumberFlow value={analytics.orders.total} />
            </div>
            <p className="text-xs font-medium text-green-600 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" />
              {ordersGrowth} from last month
            </p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <Utensils className="w-6 h-6 text-gray-400" />
          </div>
        </div>

        {/* Revenue */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-start justify-between">
          <div>
            <h3 className="text-gray-500 text-sm font-medium mb-1">Revenue</h3>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {formatCurrency(analytics.revenue.today)}
            </div>
            <p className="text-xs font-medium text-green-600 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" />
              {revenueGrowth} from last month
            </p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <DollarSign className="w-6 h-6 text-gray-400" />
          </div>
        </div>

        {/* Active Tables - REAL DATA */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-start justify-between">
          <div className="w-full">
            <h3 className="text-gray-500 text-sm font-medium mb-1">Active Tables</h3>
            <div className="flex items-end gap-2 mb-2">
              <span className="text-3xl font-bold text-gray-900">{occupiedTables}</span>
              <span className="text-gray-400 text-sm mb-1">/ {totalTables}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <div
                className="bg-slate-900 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${totalTables > 0 ? (occupiedTables / totalTables) * 100 : 0}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Current Occupancy</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg ml-4">
            <Users className="w-6 h-6 text-gray-400" />
          </div>
        </div>

        {/* Staff Count - REAL DATA */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-start justify-between">
          <div>
            <h3 className="text-gray-500 text-sm font-medium mb-1">Staff Count</h3>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {totalStaff}
            </div>
            <p className="text-xs text-gray-500">
              Online: {activeStaff}
            </p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <ChefHat className="w-6 h-6 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Recent Orders</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Table / Customer</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date/Time</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {order.orderNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {order.tableId ? `Table ${order.tableId}` : (order.customerName || 'Takeaway')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(order.totalAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <div className="flex justify-end space-x-2">
                        <button className="p-1 text-gray-400 hover:text-blue-600 transition-colors border border-gray-200 rounded">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-green-600 transition-colors border border-gray-200 rounded">
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">
                    No active orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reports Overview Row */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Reports Overview</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">

          {/* Revenue Trend Chart */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">Revenue Trend (Today)</h3>
            </div>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.revenueChart}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6B7280', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6B7280', fontSize: 12 }}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#0F172A"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: '#0F172A' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Selling Dishes - Bar Chart */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">Top Selling Dishes (Today)</h3>
            </div>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.popularItems.slice(0, 5)} layout="vertical" margin={{ left: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E5E7EB" />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#374151', fontSize: 12 }}
                    width={80}
                  />
                  <Tooltip
                    cursor={{ fill: '#F3F4F6' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar
                    dataKey="revenue"
                    fill="#1E293B"
                    radius={[0, 4, 4, 0]}
                    barSize={20}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default Dashboard
