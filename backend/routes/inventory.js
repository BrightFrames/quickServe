import express from 'express';
import InventoryItem from '../models/InventoryItem.js';
import MenuItem from '../models/MenuItem.js';
import { authenticateRestaurant } from '../middleware/auth.js';
import sequelize from '../config/database.js';

const router = express.Router();

// Get all inventory items (joined with MenuItem)
router.get('/', authenticateRestaurant, async (req, res) => {
    try {
        const restaurantId = req.restaurant.id;

        // Fetch inventory items with their menu details
        // Note: Right now we only support Menu Item specific inventory
        const inventory = await InventoryItem.findAll({
            where: { restaurantId },
            include: [{
                model: MenuItem,
                as: 'menuItem',
                attributes: ['id', 'name', 'category', 'price', 'image', 'isVegetarian', 'available']
            }],
            order: [[{ model: MenuItem, as: 'menuItem' }, 'name', 'ASC']]
        });

        res.json({ success: true, inventory });
    } catch (error) {
        console.error('Error fetching inventory:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch inventory' });
    }
});

// Update specific item stock
router.post('/update', authenticateRestaurant, async (req, res) => {
    try {
        const { menuItemId, quantity, type } = req.body; // type: 'set', 'add', 'remove'
        const restaurantId = req.restaurant.id;

        // Find or Create Inventory Record
        let inventoryItem = await InventoryItem.findOne({
            where: { restaurantId, menuItemId }
        });

        if (!inventoryItem) {
            // Check if menu item exists first
            const menuItem = await MenuItem.findByPk(menuItemId);
            if (!menuItem) {
                return res.status(404).json({ success: false, message: 'Menu item not found' });
            }

            inventoryItem = await InventoryItem.create({
                restaurantId,
                menuItemId,
                currentStock: 0,
                lowStockThreshold: 5
            });
        }

        let newStock = inventoryItem.currentStock;

        if (type === 'set') {
            newStock = quantity;
        } else if (type === 'add') {
            newStock += quantity;
        } else if (type === 'remove') {
            newStock -= quantity;
        }

        // Prevent negative stock
        if (newStock < 0) newStock = 0;

        inventoryItem.currentStock = newStock;
        inventoryItem.lastUpdatedBy = req.user ? req.user.id : null;
        await inventoryItem.save();

        // Optional: Update legacy field for backward compatibility if desired
        // await MenuItem.update({ inventoryCount: newStock }, { where: { id: menuItemId } });

        res.json({ success: true, item: inventoryItem });
    } catch (error) {
        console.error('Error updating stock:', error);
        res.status(500).json({ success: false, message: 'Failed to update stock' });
    }
});

// Sync legacy MenuItem.inventoryCount to InventoryItem (One-time or periodic tool)
router.post('/sync', authenticateRestaurant, async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const restaurantId = req.restaurant.id;
        const menuItems = await MenuItem.findAll({ where: { restaurantId } });

        let syncedCount = 0;

        for (const item of menuItems) {
            const [inventoryItem, created] = await InventoryItem.findOrCreate({
                where: { restaurantId, menuItemId: item.id },
                defaults: {
                    currentStock: item.inventoryCount || 0,
                    lowStockThreshold: item.lowStockThreshold || 5,
                    restaurantId
                },
                transaction: t
            });

            if (!created) {
                // Determine source of truth. Plan says InventoryItem is master.
                // But for first sync, if we want to carry over old data:
                // We only update if InventoryItem seems stale? 
                // For simplicity: If requested, we force sync FROM MenuItem TO InventoryItem
                inventoryItem.currentStock = item.inventoryCount || 0;
                inventoryItem.lowStockThreshold = item.lowStockThreshold || 5;
                await inventoryItem.save({ transaction: t });
            }
            syncedCount++;
        }

        await t.commit();
        res.json({ success: true, message: `Synced ${syncedCount} items` });
    } catch (error) {
        await t.rollback();
        console.error('Error syncing inventory:', error);
        res.status(500).json({ success: false, message: 'Sync failed' });
    }
});

export default router;
