import express from 'express';
import { Organization, Restaurant, Bill } from '../models/index.js';
import { authenticateRestaurant } from '../middleware/auth.js';

const router = express.Router();

// Middleware to ensure user is authorized for Org operations (can iterate on this later)
// For now, if you are an admin of ANY restaurant in the org, you can view the org details
// Ideally we need 'authenticateOrganization' middleware. 
// For Feature 21 Foundation, we will check if req.restaurant.organizationId matches.

const authenticateOrganizationMember = async (req, res, next) => {
    // Requires authenticateRestaurant to run first
    try {
        if (!req.restaurantId) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const restaurant = await Restaurant.findByPk(req.restaurantId);

        if (!restaurant || !restaurant.organizationId) {
            return res.status(403).json({ message: 'Not part of an organization' });
        }

        req.organizationId = restaurant.organizationId;
        // Also attach restaurant object for use in routes if needed
        req.restaurant = restaurant;
        next();
    } catch (error) {
        console.error("Auth Org Error:", error);
        res.status(500).json({ message: "Server error during auth" });
    }
};

// Get Organization Details + Restaurants
router.get('/my-organization', authenticateRestaurant, authenticateOrganizationMember, async (req, res) => {
    try {
        const org = await Organization.findByPk(req.organizationId, {
            include: [{
                model: Restaurant,
                as: 'restaurants',
                attributes: ['id', 'name', 'slug', 'address', 'isActive']
            }]
        });

        if (!org) {
            return res.status(404).json({ message: 'Organization not found' });
        }

        res.json({ success: true, organization: org });
    } catch (error) {
        console.error('Org fetch error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get Organization Dashboard Stats (Aggregated)
router.get('/dashboard-stats', authenticateRestaurant, authenticateOrganizationMember, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const orgId = req.organizationId;

        // Date Handling
        const start = startDate ? new Date(startDate) : new Date();
        start.setHours(0, 0, 0, 0);

        const end = endDate ? new Date(endDate) : new Date();
        end.setHours(23, 59, 59, 999);

        // Find all restaurants in this Org
        const restaurants = await Restaurant.findAll({
            where: { organizationId: orgId },
            attributes: ['id', 'name', 'slug']
        });

        const restaurantIds = restaurants.map(r => r.id);

        if (restaurantIds.length === 0) {
            return res.json({
                success: true, data: {
                    totalRevenue: 0,
                    totalOrders: 0,
                    activeOutlets: 0,
                    breakdown: []
                }
            });
        }

        const { Op } = await import('sequelize');

        // Fetch Bill Data for ALL restaurants in Org
        const bills = await Bill.findAll({
            where: {
                restaurantId: { [Op.in]: restaurantIds },
                status: 'paid', // Only count paid bills
                createdAt: {
                    [Op.between]: [start, end]
                }
            },
            attributes: ['restaurantId', 'grandTotal']
        });

        // Aggegration Logic
        let totalRevenue = 0;
        let totalOrders = bills.length;
        const breakdown = {};

        // Initialize breakdown
        restaurants.forEach(r => {
            breakdown[r.id] = {
                id: r.id,
                name: r.name,
                revenue: 0,
                orders: 0
            };
        });

        bills.forEach(bill => {
            const amount = parseFloat(bill.grandTotal);
            totalRevenue += amount;

            if (breakdown[bill.restaurantId]) {
                breakdown[bill.restaurantId].revenue += amount;
                breakdown[bill.restaurantId].orders += 1;
            }
        });

        res.json({
            success: true,
            data: {
                totalRevenue,
                totalOrders,
                activeOutlets: restaurants.length,
                breakdown: Object.values(breakdown).sort((a, b) => b.revenue - a.revenue)
            }
        });

    } catch (error) {
        console.error('Org Stats fetch error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
