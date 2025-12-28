import express from 'express';
import { Op } from 'sequelize';
import sequelize from '../config/database.js';
import Bill from '../models/Bill.js';
import { authenticateRestaurant } from '../middleware/auth.js';

const router = express.Router();

// Get Daily Sales Report
router.get('/daily-sales', authenticateRestaurant, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const restaurantId = req.restaurant.id;

        // Date Handling
        const start = startDate ? new Date(startDate) : new Date();
        start.setHours(0, 0, 0, 0);

        const end = endDate ? new Date(endDate) : new Date();
        end.setHours(23, 59, 59, 999);

        // Fetch Bill Data (Paid only)
        const bills = await Bill.findAll({
            where: {
                restaurantId,
                status: 'paid', // Only count paid bills for revenue
                createdAt: {
                    [Op.between]: [start, end]
                }
            },
            attributes: ['id', 'grandTotal', 'paymentMethod', 'createdAt']
        });

        // Aggregation Logic
        let totalSales = 0;
        let totalOrders = bills.length;
        const paymentSplit = {};

        bills.forEach(bill => {
            const amount = parseFloat(bill.grandTotal);
            totalSales += amount;

            // Payment Split
            if (paymentSplit[bill.paymentMethod]) {
                paymentSplit[bill.paymentMethod] += amount;
            } else {
                paymentSplit[bill.paymentMethod] = amount;
            }
        });

        const averageOrderValue = totalOrders > 0 ? (totalSales / totalOrders) : 0;

        res.json({
            success: true,
            data: {
                totalSales,
                totalOrders,
                averageOrderValue,
                paymentSplit,
                period: { start, end }
            }
        });

    } catch (error) {
        console.error('Error fetching sales report:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch sales report' });
    }
});

// Helper route for charts (last 7 days trend)
router.get('/sales-trend', authenticateRestaurant, async (req, res) => {
    try {
        const restaurantId = req.restaurant.id;
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 7);

        const result = await Bill.findAll({
            where: {
                restaurantId,
                status: 'paid',
                createdAt: { [Op.between]: [start, end] }
            },
            attributes: [
                [sequelize.fn('date', sequelize.col('createdAt')), 'date'],
                [sequelize.fn('sum', sequelize.col('grandTotal')), 'revenue']
            ],
            group: [sequelize.fn('date', sequelize.col('createdAt'))],
            order: [[sequelize.fn('date', sequelize.col('createdAt')), 'ASC']],
            raw: true
        });

        res.json({ success: true, data: result });
    } catch (error) {
        console.error('Error fetching sales trend:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch trend' });
    }
})

export default router;
