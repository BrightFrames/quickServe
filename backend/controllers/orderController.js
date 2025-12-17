
import orderService from "../services/orderService.js";
import { getRestaurantRoom, getKitchenRoom, getCaptainRoom } from "../utils/orderLifecycle.js";
import { sendInvoiceViaWhatsApp, sendInvoiceViaEmail, generateHTMLInvoice } from "../services/invoiceService.js";
import { createLogger } from "../utils/logger.js";
import Notification from "../models/Notification.js";
import Restaurant from "../models/Restaurant.js"; // Needed for invoice details

const logger = createLogger("OrderController");

class OrderController {

    // Helper to emit events
    emitOrderUpdate(io, restaurantId, order, eventName = "order-updated") {
        const restaurantRoom = getRestaurantRoom(restaurantId);
        const kitchenRoom = getKitchenRoom(restaurantId);
        const captainRoom = getCaptainRoom(restaurantId);
        const orderRoom = `order_${order.id}`;

        io.to(restaurantRoom).emit(eventName, order);
        io.to(kitchenRoom).emit(eventName, order);
        io.to(captainRoom).emit(eventName, order);
        io.to(orderRoom).emit("order-updated", order); // Always 'order-updated' for customer

        return { restaurantRoom, kitchenRoom, captainRoom, orderRoom };
    }

    async getActiveOrders(req, res) {
        try {
            const orders = await orderService.getActiveOrders(req.restaurantId);
            logger.info(`Retrieved ${orders.length} active orders`, { restaurantId: req.restaurantId });
            res.json(orders);
        } catch (error) {
            res.status(500).json({ message: "Server error", error: error.message });
        }
    }

    async getAllOrders(req, res) {
        try {
            const orders = await orderService.getAllOrders(req.restaurantId, req.query);
            res.json(orders);
        } catch (error) {
            res.status(500).json({ message: "Server error", error: error.message });
        }
    }

    async getOrdersByTable(req, res) {
        try {
            const orders = await orderService.getOrdersByTable(req.restaurantId, req.params.tableId);
            res.json(orders);
        } catch (error) {
            res.status(500).json({ message: "Server error", error: error.message });
        }
    }

    async createOrder(req, res) {
        try {
            // Validate secure fields here or rely on middleware (already done in route)
            const data = req.body;

            // Call Service
            const { order, lowStockAlerts, revenueMilestone, restaurantId } = await orderService.createOrder(data);

            const io = req.app.get("io");
            const restaurantRoom = getRestaurantRoom(restaurantId);

            // Handle Notifications
            if (lowStockAlerts && lowStockAlerts.length > 0) {
                for (const menuItem of lowStockAlerts) {
                    const alertMessage = `Low stock alert: ${menuItem.name} has only ${menuItem.inventoryCount} left.`;
                    const notification = await Notification.create({
                        restaurantId,
                        type: 'inventory',
                        title: 'Low Stock Alert',
                        message: alertMessage,
                        metadata: { menuItemId: menuItem.id, inventoryCount: menuItem.inventoryCount }
                    });
                    io.to(restaurantRoom).emit("notification:new", notification);
                }
            }

            if (revenueMilestone) {
                const notification = await Notification.create({
                    restaurantId,
                    type: 'revenue',
                    title: 'Revenue Milestone Reached',
                    message: `Congratulations! Your daily revenue has crossed ₹5,000. Current total: ₹${revenueMilestone.toFixed(2)}`,
                    metadata: { revenue: revenueMilestone }
                });
                io.to(restaurantRoom).emit("notification:new", notification);
            }

            // Emit Order Sockets
            this.emitOrderUpdate(io, restaurantId, order, "new-order");

            // Send Invoices (Async)
            if (order.id && !String(order.id).startsWith('temp-')) {
                const { customerEmail, customerPhone } = data;
                const orderDetails = {
                    orderNumber: order.orderNumber,
                    createdAt: order.createdAt,
                    tableNumber: order.tableNumber,
                    items: order.items,
                    subtotal: order.subtotal || order.totalAmount, // Fallback if subtotal not stored in some path
                    discount: order.discount || 0,
                    tax: order.taxAmount || 0,
                    total: order.totalAmount,
                    paymentMethod: order.paymentMethod,
                    paymentStatus: order.paymentStatus
                };

                if (customerEmail) {
                    sendInvoiceViaEmail(customerEmail, orderDetails, 1).catch(err => console.error("Email Inv Error", err));
                }
                if (customerPhone) {
                    sendInvoiceViaWhatsApp(customerPhone, orderDetails, 1).catch(err => console.error("WhatsApp Inv Error", err));
                }
            }

            res.status(201).json(order);

        } catch (error) {
            console.error("[ORDER CONTROLLER] Create Error:", error);
            if (error.message.includes("not found") || error.message.includes("required")) {
                return res.status(400).json({ message: error.message });
            }
            res.status(500).json({ message: "Server error", error: error.message });
        }
    }

    async getAdminActiveOrders(req, res) {
        try {
            const orders = await orderService.getAdminActiveOrders(req.restaurantId);
            res.json(orders);
        } catch (error) {
            res.status(500).json({ message: "Server error", error: error.message });
        }
    }

    async updateStatus(req, res) {
        try {
            const { status } = req.body;
            const { order, oldStatus } = await orderService.updateOrderStatus(req.params.id, req.restaurantId, status);

            const io = req.app.get("io");
            const rooms = this.emitOrderUpdate(io, req.restaurantId, order, "order-updated");

            logger.orderFlow("Order status updated", {
                orderId: order.id,
                orderNumber: order.orderNumber,
                from: oldStatus,
                to: status,
                restaurantId: req.restaurantId,
            });

            res.json(order);

        } catch (error) {
            if (error.message === "Order not found") return res.status(404).json({ message: error.message });
            if (error.message.includes("Invalid status transition")) return res.status(400).json({ message: error.message });
            res.status(500).json({ message: "Server error", error: error.message });
        }
    }

    async getSingleOrder(req, res) {
        try {
            const order = await orderService.getOrderById(req.params.id);
            res.json(order);
        } catch (error) {
            if (error.message.includes("not found")) return res.status(404).json({ message: error.message });
            res.status(500).json({ message: "Server error", error: error.message });
        }
    }

    async downloadInvoice(req, res) {
        try {
            const order = await orderService.getOrderById(req.params.id);
            if (order.restaurantId !== req.restaurantId) { // Check ownership
                return res.status(404).json({ message: "Order not found" });
            }

            const restaurant = await Restaurant.findByPk(req.restaurantId);

            const orderDetails = {
                orderNumber: order.orderNumber,
                createdAt: order.createdAt,
                tableNumber: order.tableNumber,
                items: order.items,
                subtotal: order.subtotal || order.totalAmount, // Handle legacy
                discount: order.discount || 0,
                tax: order.taxAmount || 0,
                total: order.totalAmount,
                paymentMethod: order.paymentMethod,
                paymentStatus: order.paymentStatus
            };

            const htmlContent = generateHTMLInvoice(orderDetails, restaurant);
            res.setHeader('Content-Type', 'text/html');
            res.setHeader('Content-Disposition', `attachment; filename="invoice-${order.orderNumber}.html"`);
            res.send(htmlContent);

        } catch (error) {
            res.status(500).json({ message: "Server error", error: error.message });
        }
    }

    async downloadPDFInvoice(req, res) {
        try {
            const order = await orderService.getOrderById(req.params.id); // Public fetch
            const restaurant = await Restaurant.findByPk(order.restaurantId);

            const orderData = {
                orderNumber: order.orderNumber,
                tableId: order.tableId,
                customerPhone: order.customerPhone,
                items: order.items,
                subtotal: order.subtotal || order.totalAmount,
                discount: order.discount || 0,
                promoCode: order.promoCode,
                taxPercentage: order.taxPercentage || 0,
                taxAmount: order.taxAmount || 0,
                totalAmount: order.totalAmount,
                paymentMethod: order.paymentMethod,
                paymentStatus: order.paymentStatus,
                createdAt: order.createdAt,
                restaurantName: restaurant?.name || 'Restaurant',
                restaurantAddress: restaurant?.address || '',
                gstNumber: restaurant?.gstNumber || '',
            };

            const { generateInvoicePDFBuffer } = await import('../services/pdfInvoiceService.js');
            const pdfBuffer = await generateInvoicePDFBuffer(orderData);

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="invoice-${order.orderNumber}.pdf"`);
            res.setHeader('Content-Length', pdfBuffer.length);
            res.send(pdfBuffer);

        } catch (error) {
            res.status(500).json({ message: "Server error", error: error.message });
        }
    }
}

export default new OrderController();
