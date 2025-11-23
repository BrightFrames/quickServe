import express from 'express'
import Order from '../models/Order.js'

const router = express.Router()

// Get analytics
router.get('/', async (req, res) => {
  try {
    const { period = 'today' } = req.query

    // Calculate date range
    const now = new Date()
    let startDate = new Date()

    switch (period) {
      case 'today':
        startDate.setHours(0, 0, 0, 0)
        break
      case '7days':
        startDate.setDate(now.getDate() - 7)
        break
      case '30days':
        startDate.setDate(now.getDate() - 30)
        break
      default:
        startDate.setHours(0, 0, 0, 0)
    }

    // Revenue Analytics
    const revenueOrders = await Order.find({
      createdAt: { $gte: startDate },
      status: { $ne: 'cancelled' },
    })

    const todayRevenue = revenueOrders
      .filter((o) => {
        const orderDate = new Date(o.createdAt)
        return orderDate.toDateString() === now.toDateString()
      })
      .reduce((sum, o) => sum + o.totalAmount, 0)

    const last7DaysRevenue = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          status: { $ne: 'cancelled' },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalAmount' },
        },
      },
    ])

    const last30DaysRevenue = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          status: { $ne: 'cancelled' },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalAmount' },
        },
      },
    ])

    // Order Analytics
    const orders = await Order.find({
      createdAt: { $gte: startDate },
    })

    const orderStats = {
      total: orders.length,
      completed: orders.filter((o) => o.status === 'delivered').length,
      inProgress: orders.filter((o) => ['pending', 'preparing', 'prepared'].includes(o.status)).length,
      cancelled: orders.filter((o) => o.status === 'cancelled').length,
    }

    // Popular Items
    const popularItems = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: { $ne: 'cancelled' },
        },
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.name',
          orders: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        },
      },
      { $sort: { orders: -1 } },
      { $limit: 10 },
      {
        $project: {
          _id: 0,
          name: '$_id',
          orders: 1,
          revenue: 1,
        },
      },
    ])

    // Revenue Chart Data
    const revenueChart = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]

      const dayRevenue = await Order.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(date.setHours(0, 0, 0, 0)),
              $lt: new Date(date.setHours(23, 59, 59, 999)),
            },
            status: { $ne: 'cancelled' },
          },
        },
        {
          $group: {
            _id: null,
            revenue: { $sum: '$totalAmount' },
          },
        },
      ])

      revenueChart.push({
        date: dateStr,
        revenue: dayRevenue[0]?.revenue || 0,
      })
    }

    // Order Status Chart
    const orderStatusChart = [
      { status: 'Completed', count: orderStats.completed },
      { status: 'In Progress', count: orderStats.inProgress },
      { status: 'Cancelled', count: orderStats.cancelled },
    ]

    res.json({
      revenue: {
        today: todayRevenue,
        last7Days: last7DaysRevenue[0]?.total || 0,
        last30Days: last30DaysRevenue[0]?.total || 0,
      },
      orders: orderStats,
      popularItems,
      revenueChart,
      orderStatusChart,
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
})

export default router
