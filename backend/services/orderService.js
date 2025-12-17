
import { Op } from "sequelize";
import Order from "../models/Order.js";
import Restaurant from "../models/Restaurant.js";
import MenuItem from "../models/MenuItem.js";
import Table from "../models/Table.js";
import PromoCode from "../models/PromoCode.js";
import Notification from "../models/Notification.js";
import { validateStatusTransition } from "../utils/orderLifecycle.js";

// Toggle to control whether orders are persisted to DB. Set SAVE_ORDERS=true to enable saves.
const SAVE_ORDERS = process.env.SAVE_ORDERS === "true";

class OrderService {

    async getRestaurantIdBySlug(slug) {
        if (!slug || typeof slug !== 'string') return null;
        const restaurant = await Restaurant.findOne({
            where: { slug: slug.toLowerCase().trim() },
            attributes: ['id']
        });
        return restaurant ? restaurant.id : null;
    }

    async getActiveOrders(restaurantId) {
        if (!SAVE_ORDERS) return [];

        return await Order.findAll({
            where: {
                restaurantId,
                status: {
                    [Op.in]: ["pending", "preparing", "ready", "served"],
                },
            },
            order: [['createdAt', 'DESC']],
        });
    }

    async getAllOrders(restaurantId, filters = {}) {
        if (!SAVE_ORDERS) return [];

        const whereClause = { restaurantId };

        if (filters.status) whereClause.status = filters.status;
        if (filters.tableId) whereClause.tableId = filters.tableId;
        if (filters.startDate || filters.endDate) {
            whereClause.createdAt = {};
            if (filters.startDate) whereClause.createdAt[Op.gte] = new Date(filters.startDate);
            if (filters.endDate) whereClause.createdAt[Op.lte] = new Date(filters.endDate);
        }

        return await Order.findAll({
            where: whereClause,
            order: [['createdAt', 'DESC']],
        });
    }

    async getOrdersByTable(restaurantId, tableId) {
        if (!SAVE_ORDERS) return [];

        return await Order.findAll({
            where: { restaurantId, tableId },
            order: [['createdAt', 'DESC']],
        });
    }

    async createOrder(data) {
        const { tableNumber, tableId, items, customerPhone, customerEmail, paymentMethod, promoCode, restaurantId, slug } = data;

        // 1. Resolve Restaurant ID
        let finalRestaurantId = null;
        if (restaurantId && !isNaN(parseInt(restaurantId))) {
            finalRestaurantId = parseInt(restaurantId, 10);
        } else if (slug) {
            finalRestaurantId = await this.getRestaurantIdBySlug(slug);
        }

        if (!finalRestaurantId) throw new Error("Restaurant ID or slug is required");

        const restaurant = await Restaurant.findByPk(finalRestaurantId);
        if (!restaurant) throw new Error("Restaurant not found");

        // 2. Validate Items
        if (!items || !Array.isArray(items) || items.length === 0) {
            throw new Error("Order must contain at least one item");
        }

        // 3. Resolve Table
        let finalTableId = tableId;
        let finalTableNumber = tableNumber;

        if (tableId) {
            const table = await Table.findOne({ where: { tableId, restaurantId: finalRestaurantId } });
            if (table) {
                if (!table.isActive) throw new Error(`Table ${tableId} is not active`);
                finalTableId = table.tableId;
                finalTableNumber = parseInt(table.tableId.replace(/\D/g, "")) || tableNumber || 1;
            } else {
                // Use provided ID if not found in DB (fallback)
                finalTableId = tableId;
                finalTableNumber = parseInt(tableId.replace(/\D/g, "")) || tableNumber || 1;
            }
        } else {
            finalTableId = `T${tableNumber || 1}`;
            finalTableNumber = tableNumber || 1;
        }

        // 4. Process Items & Inventory
        let subtotal = 0;
        const orderItems = [];
        const lowStockAlerts = [];

        for (const item of items) {
            const menuItem = await MenuItem.findOne({
                where: { id: item.menuItemId, restaurantId: finalRestaurantId }
            });

            if (!menuItem) throw new Error(`Menu item ${item.name} not found`);

            if (!menuItem.available || menuItem.inventoryCount < item.quantity) {
                throw new Error(`${menuItem.name} is not available or insufficient stock`);
            }

            // Update inventory
            menuItem.inventoryCount -= item.quantity;
            await menuItem.save();

            // Check for low stock logic (threshold < 5)
            if (menuItem.trackInventory && menuItem.inventoryCount < 5) {
                lowStockAlerts.push(menuItem);
            }

            subtotal += parseFloat(menuItem.price) * item.quantity;
            orderItems.push({
                menuItemId: menuItem.id,
                name: menuItem.name,
                quantity: item.quantity,
                price: parseFloat(menuItem.price),
                specialInstructions: item.specialInstructions || "",
            });
        }

        // 5. Promo Code
        let discount = 0;
        let promoCodeApplied = null;
        if (promoCode) {
            const promo = await PromoCode.findOne({
                where: { code: promoCode.toUpperCase(), restaurantId: finalRestaurantId }
            });

            if (promo && promo.isValid()) {
                if (subtotal >= promo.minOrderAmount) {
                    discount = (subtotal * promo.discountPercentage) / 100;
                    promoCodeApplied = {
                        code: promo.code,
                        discountPercentage: parseFloat(promo.discountPercentage),
                        discountAmount: parseFloat(discount.toFixed(2)),
                    };
                    promo.usedCount += 1;
                    await promo.save();
                } else {
                    throw new Error(`Minimum order amount of ₹${promo.minOrderAmount} required for this promo code`);
                }
            } else {
                throw new Error("Invalid or expired promo code");
            }
        }

        // 6. Totals
        const taxPercentage = restaurant.taxPercentage || 5.0;
        const amountAfterDiscount = subtotal - discount;
        const taxAmount = (amountAfterDiscount * taxPercentage) / 100;
        const totalAmount = amountAfterDiscount + taxAmount;

        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        const orderNumber = `R${finalRestaurantId}_${timestamp}_${random}`;

        const orderData = {
            restaurantId: finalRestaurantId,
            orderNumber,
            tableId: finalTableId,
            tableNumber: finalTableNumber,
            customerPhone,
            customerEmail,
            items: orderItems,
            subtotal: parseFloat(subtotal.toFixed(2)),
            discount: parseFloat(discount.toFixed(2)),
            promoCode: promoCodeApplied,
            taxPercentage: parseFloat(taxPercentage),
            taxAmount: parseFloat(taxAmount.toFixed(2)),
            totalAmount: parseFloat(totalAmount.toFixed(2)),
            status: "preparing",
            paymentMethod: paymentMethod || "cash",
            paymentStatus: "pending",
        };

        let order;
        if (SAVE_ORDERS) {
            order = await Order.create(orderData);
        } else {
            order = {
                ...orderData,
                id: `temp-${Date.now()}`,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
        }

        // 7. Check Revenue Milestone
        let revenueMilestone = null;
        if (SAVE_ORDERS) {
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            const revenueStats = await Order.sum('totalAmount', {
                where: {
                    restaurantId: finalRestaurantId,
                    createdAt: { [Op.gte]: todayStart },
                    status: { [Op.not]: 'cancelled' }
                }
            });
            const currentRevenue = parseFloat(revenueStats || 0);
            if (currentRevenue >= 5000) {
                // Check if validated already
                const existingNotification = await Notification.findOne({
                    where: {
                        restaurantId: finalRestaurantId,
                        type: 'revenue',
                        createdAt: { [Op.gte]: todayStart },
                        title: 'Revenue Milestone Reached'
                    }
                });
                if (!existingNotification) {
                    revenueMilestone = currentRevenue;
                }
            }
        }

        return {
            order,
            lowStockAlerts,
            revenueMilestone,
            restaurantId: finalRestaurantId
        };
    }

    async getAdminActiveOrders(restaurantId) {
        if (!SAVE_ORDERS) return [];

        return await Order.findAll({
            where: {
                restaurantId,
                status: {
                    [Op.in]: ["pending", "preparing", "ready", "prepared", "served", "completed"],
                },
                createdAt: {
                    [Op.gte]: new Date(new Date() - 10 * 24 * 60 * 60 * 1000), // Last 10 days
                },
            },
            order: [["createdAt", "DESC"]],
        });
    }

    async updateOrderStatus(orderId, restaurantId, status) {
        if (!status) throw new Error("Status is required");

        if (!SAVE_ORDERS) {
            return {
                id: orderId,
                status,
                updatedAt: new Date(),
                restaurantId
            };
        }

        const order = await Order.findOne({
            where: { id: orderId, restaurantId }
        });

        if (!order) throw new Error("Order not found");

        validateStatusTransition(order.status, status, order.orderNumber);

        const oldStatus = order.status;
        await order.update({ status });

        return { order, oldStatus };
    }

    async getOrderById(orderId) {
        if (!SAVE_ORDERS) throw new Error("Order not found (persistence disabled)");

        const order = await Order.findByPk(orderId);
        if (!order) throw new Error("Order not found");
        return order;
    }
}

export default new OrderService();
