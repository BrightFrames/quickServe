import { useEffect, useState } from 'react'
import axios from 'axios'
import { TrendingUp, ShoppingCart, Package, AlertCircle, DollarSign, CheckCircle, Clock, XCircle } from 'lucide-react'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '../../lib/utils'
import { useRestaurant } from '../../context/RestaurantContext'

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
  orderStatusChart: Array<{
    status: string
    count: number
  }>
}

const COLORS = ['#10B981', '#3B82F6', '#EF4444', '#F59E0B']

const Dashboard = () => {
  const { restaurantSlug } = useRestaurant()
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'today' | '7days' | '30days'>('today')
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'

  const getAxiosConfig = () => ({
    headers: {
      'x-restaurant-slug': restaurantSlug || '',
    }
  })

  useEffect(() => {
    fetchAnalytics()
  }, [period])

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get(`${apiUrl}/api/analytics?period=${period}`, getAxiosConfig())
      setAnalytics(response.data)
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!analytics) return null

  const statsCards = [
    {
      title: 'Today\'s Revenue',
      value: formatCurrency(analytics.revenue.today),
      icon: DollarSign,
      color: 'bg-green-500',
      trend: '+12.5%'
    },
    {
      title: 'Total Orders',
      value: analytics.orders.total,
      icon: ShoppingCart,
      color: 'bg-blue-500',
      trend: '+8.3%'
    },
    {
      title: 'Completed',
      value: analytics.orders.completed,
      icon: CheckCircle,
      color: 'bg-green-500',
      trend: `${((analytics.orders.completed / analytics.orders.total) * 100).toFixed(1)}%`
    },
    {
      title: 'In Progress',
      value: analytics.orders.inProgress,
      icon: Clock,
      color: 'bg-yellow-500',
      trend: ''
    },
  ]

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex space-x-2">
        {[
          { value: 'today' as const, label: 'Today' },
          { value: '7days' as const, label: 'Last 7 Days' },
          { value: '30days' as const, label: 'Last 30 Days' },
        ].map((option) => (
          <button
            key={option.value}
            onClick={() => setPeriod(option.value)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              period === option.value
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((card, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`${card.color} p-3 rounded-lg`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
              {card.trend && (
                <span className="text-sm font-medium text-green-600">{card.trend}</span>
              )}
            </div>
            <h3 className="text-gray-600 text-sm font-medium">{card.title}</h3>
            <p className="text-2xl font-bold text-gray-800 mt-1">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.revenueChart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Order Status Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Order Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analytics.orderStatusChart}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {analytics.orderStatusChart.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Popular Items */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Popular Items</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Item Name</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Orders</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {analytics.popularItems.map((item, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">{item.name}</td>
                  <td className="py-3 px-4">{item.orders}</td>
                  <td className="py-3 px-4 font-semibold">{formatCurrency(item.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
