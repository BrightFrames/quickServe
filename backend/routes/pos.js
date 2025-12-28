import express from 'express';
import Bill from '../models/Bill.js';
import Order from '../models/Order.js';
import Restaurant from '../models/Restaurant.js';
import { authenticateRestaurant } from '../middleware/auth.js';

const router = express.Router();

// Generate next bill number helper
const generateBillNumber = async (restaurantId) => {
    const count = await Bill.count({ where: { restaurantId } });
    const date = new Date();
    const prefix = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
    return `BILL-${prefix}-${String(count + 1).padStart(4, '0')}`;
};

// Create a new Bill
router.post('/create', authenticateRestaurant, async (req, res) => {
    try {
        const {
            items,
            tableId,
            tableNumber,
            subtotal,
            taxAmount,
            discountAmount,
            grandTotal,
            paymentMethod,
            customerName,
            customerPhone,
            orderId
        } = req.body;

        const restaurantId = req.restaurant.id;

        const billNumber = await generateBillNumber(restaurantId);

        const newBill = await Bill.create({
            restaurantId,
            billNumber,
            items,
            tableId,
            tableNumber,
            subtotal,
            taxAmount,
            discountAmount,
            grandTotal,
            paymentMethod,
            customerName,
            customerPhone,
            orderId, // Link if provided
            status: 'created',
            createdBy: req.user ? req.user.id : null // If you have user info in request
        });

        // If linked to an order, optionally update order status or link back?
        // For now, standalone or loosely coupled.

        res.status(201).json({ success: true, bill: newBill });
    } catch (error) {
        console.error('Error creating bill:', error);
        res.status(500).json({ success: false, message: 'Failed to create bill' });
    }
});

// Get all bills for a restaurant
router.get('/', authenticateRestaurant, async (req, res) => {
    try {
        const restaurantId = req.restaurant.id;
        const { status, startDate, endDate } = req.query;

        const whereClause = { restaurantId };

        if (status) {
            whereClause.status = status;
        }

        // basic date filtering could be added here

        const bills = await Bill.findAll({
            where: whereClause,
            order: [['createdAt', 'DESC']],
            limit: 50 // meaningful limit
        });

        res.json({ success: true, bills });
    } catch (error) {
        console.error('Error fetching bills:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch bills' });
    }
});

// Update Bill Status
router.put('/:id/status', authenticateRestaurant, async (req, res) => {
    try {
        const { id } = req.params;
        const { status, paymentMethod } = req.body;
        const restaurantId = req.restaurant.id;

        const bill = await Bill.findOne({ where: { id, restaurantId } });

        if (!bill) {
            return res.status(404).json({ success: false, message: 'Bill not found' });
        }

        bill.status = status;
        if (paymentMethod) {
            bill.paymentMethod = paymentMethod;
        }

        await bill.save();

        res.json({ success: true, bill });
    } catch (error) {
        console.error('Error updating bill:', error);
        res.status(500).json({ success: false, message: 'Failed to update bill' });
    }
});

export default router;
