import express from 'express';
import { Notification } from '../models/index.js';
import { authenticateRestaurant } from '../middleware/auth.js';
import { enforceTenantIsolation } from '../middleware/rbac.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateRestaurant);
router.use(enforceTenantIsolation);

// Get all notifications
router.get('/', async (req, res) => {
    try {
        const notifications = await Notification.findAll({
            where: {
                restaurantId: req.restaurantId,
            },
            order: [['createdAt', 'DESC']],
            limit: 50 // Limit to last 50 notifications
        });
        res.json(notifications);
    } catch (error) {
        console.error('[NOTIFICATIONS] Error fetching notifications:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get unread count
router.get('/unread-count', async (req, res) => {
    try {
        const count = await Notification.count({
            where: {
                restaurantId: req.restaurantId,
                isRead: false
            }
        });
        res.json({ count });
    } catch (error) {
        console.error('[NOTIFICATIONS] Error fetching unread count:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Mark as read
router.patch('/:id/read', async (req, res) => {
    try {
        const { id } = req.params;

        const notification = await Notification.findOne({
            where: {
                id,
                restaurantId: req.restaurantId
            }
        });

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        notification.isRead = true;
        await notification.save();

        res.json({ success: true, message: 'Marked as read' });
    } catch (error) {
        console.error('[NOTIFICATIONS] Error marking as read:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Mark all as read
router.post('/mark-all-read', async (req, res) => {
    try {
        await Notification.update(
            { isRead: true },
            {
                where: {
                    restaurantId: req.restaurantId,
                    isRead: false
                }
            }
        );

        res.json({ success: true, message: 'All marked as read' });
    } catch (error) {
        console.error('[NOTIFICATIONS] Error marking all as read:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
