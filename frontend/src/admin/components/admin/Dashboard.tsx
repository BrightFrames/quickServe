import { useEffect, useState, useRef } from 'react'
import axios from 'axios'
import { TrendingUp, ShoppingCart, Package, AlertCircle, DollarSign, CheckCircle, Clock, XCircle } from 'lucide-react'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '../../lib/utils'
import { useRestaurant } from '../../context/RestaurantContext'
import { TimelineContent } from '../ui/timeline-animation'
import { Sparkles } from '../ui/sparkles'
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
  const dashboardRef = useRef<HTMLDivElement>(null)
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
      const response = await axios.get(`/api/analytics?period=${period}`)
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

  const revealVariants = {
    visible: (i: number) => ({
      y: 0,
      opacity: 1,
      filter: "blur(0px)",
      transition: {
        delay: i * 0.15,
        duration: 0.6,
        ease: "easeOut",
      },
    }),
    hidden: {
      filter: "blur(10px)",
      y: 30,
      opacity: 0,
    },
  };

  return (
    <div className="space-y-6 relative" ref={dashboardRef}>
      {/* Sparkles Background Effect */}
      <TimelineContent
        animationNum={0}
        timelineRef={dashboardRef}
        customVariants={revealVariants}
        className="absolute top-0 right-0 h-96 w-full overflow-hidden pointer-events-none [mask-image:radial-gradient(50%_50%,white,transparent)]"
      >
        <Sparkles
          density={800}
          direction="bottom"
          speed={0.5}
          color="#3B82F6"
          className="absolute inset-x-0 top-0 h-full w-full"
        />
      </TimelineContent>

      {/* Period Selector */}
      <TimelineContent
        as="div"
        animationNum={1}
        timelineRef={dashboardRef}
        customVariants={revealVariants}
        className="flex space-x-2 relative z-10"
      >
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
      </TimelineContent>

      {/* Stats Cards with Animated Reveal */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
        {statsCards.map((card, index) => (
          <TimelineContent
            key={index}
            animationNum={2 + index}
            timelineRef={dashboardRef}
            customVariants={revealVariants}
          >
            <div className="relative bg-gradient-to-br from-white via-gray-50 to-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 border border-gray-100 overflow-hidden group">
              {/* Gradient Glow Effect on Hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className={`${card.color} p-3 rounded-xl shadow-lg`}>
                    <card.icon className="w-6 h-6 text-white" />
                  </div>
                  {card.trend && (
                    <span className="text-sm font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full">
                      {card.trend}
                    </span>
                  )}
                </div>
                <h3 className="text-gray-600 text-sm font-semibold tracking-wide uppercase mb-2">
                  {card.title}
                </h3>
                <p className="text-3xl font-bold text-gray-900">
                  {typeof card.value === 'number' ? (
                    <NumberFlow value={card.value} />
                  ) : (
                    card.value
                  )}
                </p>
              </div>
            </div>
          </TimelineContent>
        ))}
      </div>

      {/* Charts with Animated Reveal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
        {/* Revenue Chart */}
        <TimelineContent
          animationNum={6}
          timelineRef={dashboardRef}
          customVariants={revealVariants}
        >
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
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
        </TimelineContent>

        {/* Order Status Chart */}
        <TimelineContent
          animationNum={7}
          timelineRef={dashboardRef}
          customVariants={revealVariants}
        >
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
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
        </TimelineContent>
      </div>

      {/* Popular Items with Animated Reveal */}
      <TimelineContent
        animationNum={8}
        timelineRef={dashboardRef}
        customVariants={revealVariants}
      >
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 relative z-10">
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
      </TimelineContent>
    </div>
  )
}

export default Dashboard
