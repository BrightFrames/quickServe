import express from 'express'
import { Op } from 'sequelize'
import Order from '../models/Order.js'
import sequelize from '../config/database.js'
import { authenticateRestaurant } from '../middleware/auth.js'

const router = express.Router()

// Apply authentication to all routes
router.use(authenticateRestaurant);

// Get analytics
router.get('/', async (req, res) => {
  try {
    const { period = 'today' } = req.query
    const restaurantId = req.restaurantId;

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

    // Revenue Analytics - Today's Revenue
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    const todayOrders = await Order.findAll({
      where: {
        restaurantId: restaurantId,
        createdAt: {
          [Op.between]: [todayStart, todayEnd],
        },
        status: {
          [Op.ne]: 'cancelled',
        },
      },
    });

    const todayRevenue = todayOrders.reduce((sum, o) => sum + parseFloat(o.totalAmount), 0)

    // Last 7 days revenue
    const last7DaysStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const [last7DaysResult] = await sequelize.query(`
      SELECT COALESCE(SUM(CAST("totalAmount" AS DECIMAL)), 0) as total
      FROM orders
      WHERE "restaurantId" = :restaurantId
      AND "createdAt" >= :startDate
      AND status != 'cancelled'
    `, {
      replacements: { restaurantId, startDate: last7DaysStart },
    });

    const last7DaysRevenue = parseFloat(last7DaysResult[0]?.total) || 0

    // Last 30 days revenue
    const last30DaysStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const [last30DaysResult] = await sequelize.query(`
      SELECT COALESCE(SUM(CAST("totalAmount" AS DECIMAL)), 0) as total
      FROM orders
      WHERE "restaurantId" = :restaurantId
      AND "createdAt" >= :startDate
      AND status != 'cancelled'
    `, {
      replacements: { restaurantId, startDate: last30DaysStart },
    });

    const last30DaysRevenue = parseFloat(last30DaysResult[0]?.total) || 0

    // Order Analytics
    const orders = await Order.findAll({
      where: {
        restaurantId: restaurantId,
        createdAt: {
          [Op.gte]: startDate,
        },
      },
    });

    const orderStats = {
      total: orders.length,
      completed: orders.filter((o) => o.status === 'delivered').length,
      inProgress: orders.filter((o) => ['pending', 'preparing', 'prepared'].includes(o.status)).length,
      cancelled: orders.filter((o) => o.status === 'cancelled').length,
    }

    // Popular Items - Using raw query for JSONB array processing
    const [popularItems] = await sequelize.query(`
      SELECT 
        item->>'name' as name,
        SUM((item->>'quantity')::int) as orders,
        SUM((item->>'price')::decimal * (item->>'quantity')::int) as revenue
      FROM orders, jsonb_array_elements(items) as item
      WHERE "restaurantId" = :restaurantId
      AND "createdAt" >= :startDate
      AND status != 'cancelled'
      GROUP BY item->>'name'
      ORDER BY orders DESC
      LIMIT 10
    `, {
      replacements: { restaurantId, startDate },
    });

    // Revenue Chart Data - Last 7 days
    const revenueChart = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStart = new Date(date.setHours(0, 0, 0, 0))
      const dateEnd = new Date(date.setHours(23, 59, 59, 999))
      const dateStr = new Date(dateStart).toISOString().split('T')[0]

      const [dayRevenue] = await sequelize.query(`
        SELECT COALESCE(SUM(CAST("totalAmount" AS DECIMAL)), 0) as revenue
        FROM orders
        WHERE "restaurantId" = :restaurantId
        AND "createdAt" >= :startDate
        AND "createdAt" <= :endDate
        AND status != 'cancelled'
      `, {
        replacements: { restaurantId, startDate: dateStart, endDate: dateEnd },
      });

      revenueChart.push({
        date: dateStr,
        revenue: parseFloat(dayRevenue[0]?.revenue) || 0,
      })
    }

    // Order Status Chart
    const orderStatusChart = [
      { status: 'Completed', count: orderStats.completed },
      { status: 'In Progress', count: orderStats.inProgress },
      { status: 'Cancelled', count: orderStats.cancelled },
    ]

    console.log('[ANALYTICS] Generated analytics');
    
    res.json({
      revenue: {
        today: todayRevenue,
        last7Days: last7DaysRevenue,
        last30Days: last30DaysRevenue,
      },
      orders: orderStats,
      popularItems: popularItems.map(item => ({
        name: item.name,
        orders: parseInt(item.orders),
        revenue: parseFloat(item.revenue),
      })),
      revenueChart,
      orderStatusChart,
    })
  } catch (error) {
    console.error('[ANALYTICS] Error:', error)
    res.status(500).json({ message: 'Server error', error: error.message })
  }
})

export default router
