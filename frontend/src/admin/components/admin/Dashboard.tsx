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
    fetchAnalytics()
  }, [period])

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get(`${apiUrl}/api/analytics?period=${period}`, getAxiosConfig())
      setAnalytics(response.data)
    } catch (error) {
      console.error('Error fetching analytics:', error)
      // Set empty analytics on error to prevent crash
      setAnalytics({
        revenue: { today: 0, last7Days: 0, last30Days: 0 },
        orders: { total: 0, completed: 0, inProgress: 0, cancelled: 0 },
        popularItems: [],
        revenueChart: [],
        orderStatusChart: []
      })
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 pb-6 sm:pb-8" ref={dashboardRef}>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
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

        {/* Dashboard Header */}
        <div className="pt-4 sm:pt-6 md:pt-8 pb-4 sm:pb-6 relative z-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Analytics Dashboard</h1>
          <p className="text-xs sm:text-sm text-gray-600">Monitor your restaurant performance and key metrics</p>
        </div>

        {/* Period Selector */}
        <TimelineContent
          as="div"
          animationNum={1}
          timelineRef={dashboardRef}
          customVariants={revealVariants}
          className="flex flex-wrap gap-2 mb-4 sm:mb-6 relative z-10"
        >
        {[
          { value: 'today' as const, label: 'Today' },
          { value: '7days' as const, label: 'Last 7 Days' },
          { value: '30days' as const, label: 'Last 30 Days' },
        ].map((option) => (
          <button
            key={option.value}
            onClick={() => setPeriod(option.value)}
            className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all duration-200 flex-1 sm:flex-initial min-w-[90px] ${
              period === option.value
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30 scale-105'
                : 'bg-white text-gray-700 hover:bg-gray-50 shadow-sm border border-gray-200 hover:border-blue-300 active:scale-95'
            }`}
          >
            {option.label}
          </button>
        ))}
      </TimelineContent>

        {/* Stats Cards with Animated Reveal */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5 mb-4 sm:mb-6 relative z-10">
        {statsCards.map((card, index) => (
          <TimelineContent
            key={index}
            animationNum={2 + index}
            timelineRef={dashboardRef}
            customVariants={revealVariants}
          >
            <div className="relative bg-white rounded-xl sm:rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 p-4 sm:p-5 md:p-6 border border-gray-100 overflow-hidden group">
              {/* Gradient Glow Effect on Hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className={`${card.color} p-2.5 sm:p-3 rounded-lg sm:rounded-xl shadow-md group-hover:scale-110 transition-transform duration-300`}>
                    <card.icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  {card.trend && (
                    <span className="text-[10px] sm:text-xs font-bold text-green-600 bg-green-50 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full border border-green-200">
                      {card.trend}
                    </span>
                  )}
                </div>
                <h3 className="text-gray-500 text-[10px] sm:text-xs font-semibold tracking-wide uppercase mb-1.5 sm:mb-2">
                  {card.title}
                </h3>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 md:gap-6 mb-4 sm:mb-6 relative z-10">
        {/* Revenue Chart */}
        <TimelineContent
          animationNum={6}
          timelineRef={dashboardRef}
          customVariants={revealVariants}
        >
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-300 p-4 sm:p-5 md:p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-0.5 sm:mb-1">Revenue Trend</h3>
              <p className="text-[10px] sm:text-xs text-gray-500">Track revenue over time</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
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
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-300 p-4 sm:p-5 md:p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-0.5 sm:mb-1">Order Status</h3>
              <p className="text-[10px] sm:text-xs text-gray-500">Distribution of order states</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
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
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-300 p-4 sm:p-5 md:p-6 border border-gray-100 relative z-10">
        <div className="mb-4 sm:mb-6">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-0.5 sm:mb-1">Popular Items</h3>
          <p className="text-[10px] sm:text-xs text-gray-500">Best-selling menu items by revenue</p>
        </div>
        <div className="overflow-x-auto -mx-4 sm:-mx-5 md:-mx-6 px-4 sm:px-5 md:px-6">
          <table className="w-full min-w-[500px]">
            <thead>
              <tr className="border-b-2 border-gray-200 bg-gray-50">
                <th className="text-left py-2.5 sm:py-3 px-3 sm:px-4 font-semibold text-[10px] sm:text-xs uppercase tracking-wider text-gray-600">Item Name</th>
                <th className="text-left py-2.5 sm:py-3 px-3 sm:px-4 font-semibold text-[10px] sm:text-xs uppercase tracking-wider text-gray-600">Orders</th>
                <th className="text-left py-2.5 sm:py-3 px-3 sm:px-4 font-semibold text-[10px] sm:text-xs uppercase tracking-wider text-gray-600">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {analytics.popularItems.map((item, index) => (
                <tr key={index} className="hover:bg-blue-50/50 transition-colors duration-150">
                  <td className="py-3 sm:py-4 px-3 sm:px-4 font-medium text-gray-900 text-sm sm:text-base">{item.name}</td>
                  <td className="py-3 sm:py-4 px-3 sm:px-4 text-gray-600">
                    <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold bg-blue-100 text-blue-800">
                      {item.orders}
                    </span>
                  </td>
                  <td className="py-3 sm:py-4 px-3 sm:px-4 font-bold text-gray-900 text-sm sm:text-base">{formatCurrency(item.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </TimelineContent>
      </div>
    </div>
  )
}

export default Dashboard
