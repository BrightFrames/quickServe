import express from "express";
import { Op } from "sequelize";
import { authenticateRestaurant, optionalRestaurantAuth } from "../middleware/auth.js";
import { sanitizeCustomerInput, rateLimitCustomer } from "../middleware/customerSecurity.js";
import { sendInvoiceViaWhatsApp, sendInvoiceViaEmail } from "../services/invoiceService.js";
import { orderRateLimiter } from "../utils/rateLimiter.js";
import { validateOrderCreation } from "../utils/validators.js";
import {
  validateStatusTransition,
  getRestaurantRoom,
  getKitchenRoom,
  getCaptainRoom,
  ORDER_STATUS,
  isActiveOrder
} from "../utils/orderLifecycle.js";
import { createLogger } from "../utils/logger.js";
import { enforceTenantIsolation, requirePermission } from "../middleware/rbac.js";
import Restaurant from "../models/Restaurant.js";
import Order from "../models/Order.js";
import MenuItem from "../models/MenuItem.js";
import Table from "../models/Table.js";
import PromoCode from "../models/PromoCode.js";

const router = express.Router();
const logger = createLogger("Orders");

// Toggle to control whether orders are persisted to DB. Set SAVE_ORDERS=true to enable saves.
const SAVE_ORDERS = process.env.SAVE_ORDERS === "true";

/**
 * Helper: Map restaurant slug to restaurantId (primary key)
 * Ensures all order queries use the database primary key
 * @param {string} slug - Restaurant slug
 * @returns {Promise<number|null>} Restaurant ID or null
 */
async function getRestaurantIdBySlug(slug) {
  if (!slug || typeof slug !== 'string') return null;

  const restaurant = await Restaurant.findOne({
    where: { slug: slug.toLowerCase().trim() },
    attributes: ['id']
  });

  return restaurant ? restaurant.id : null;
}

/**
 * Helper: Validate restaurant ID
 * @param {any} id - Restaurant ID to validate
 * @returns {boolean} True if valid
 */
function isValidRestaurantId(id) {
  const numId = parseInt(id, 10);
  return !isNaN(numId) && numId > 0;
}

// Get all active orders (not completed or cancelled) - requires authentication
router.get("/active", authenticateRestaurant, enforceTenantIsolation, requirePermission('read:orders'), async (req, res) => {
  try {
    if (!SAVE_ORDERS) {
      return res.json([]);
    }

    const whereClause = {
      restaurantId: req.restaurantId,
      status: {
        [Op.in]: ["pending", "preparing", "ready", "served"],
      },
    };

    const orders = await Order.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
    });

    logger.info(`Retrieved ${orders.length} active orders`, {
      restaurantId: req.restaurantId,
    });
    res.json(orders);
  } catch (error) {
    logger.error("Error fetching active orders", {
      restaurantId: req.restaurantId,
      error: error.message,
    });
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get all orders - requires authentication
router.get("/", authenticateRestaurant, enforceTenantIsolation, requirePermission('read:orders'), async (req, res) => {
  try {
    if (!SAVE_ORDERS) {
      return res.json([]);
    }

    const { status, startDate, endDate, tableId } = req.query;

    const filter = {
      restaurantId: req.restaurantId
    };

    if (status) {
      filter.status = status;
    }

    if (tableId) {
      filter.tableId = tableId;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt[Op.gte] = new Date(startDate);
      if (endDate) filter.createdAt[Op.lte] = new Date(endDate);
    }

    const orders = await Order.findAll({
      where: filter,
      order: [['createdAt', 'DESC']],
    });

    console.log(`[ORDERS] Retrieved ${orders.length} orders for restaurant ${req.restaurantId}`);
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get orders by tableId
// Get orders by table - requires authentication  
router.get("/by-table/:tableId", authenticateRestaurant, enforceTenantIsolation, requirePermission('read:orders'), async (req, res) => {
  try {
    if (!SAVE_ORDERS) {
      return res.json([]);
    }

    const orders = await Order.findAll({
      where: {
        restaurantId: req.restaurantId,
        tableId: req.params.tableId,
      },
      order: [['createdAt', 'DESC']],
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Create order - public endpoint, restaurantId from request body
// Apply rate limiting and input sanitization for customer protection
router.post("/", orderRateLimiter, rateLimitCustomer, sanitizeCustomerInput, validateOrderCreation, async (req, res) => {
  try {

    const { tableNumber, tableId, items, customerPhone, customerEmail, paymentMethod, promoCode, restaurantId, slug } = req.body;

    // CORE FIX: Get restaurantId from slug if not provided directly
    // Always use restaurantId (primary key) for all subsequent queries
    let finalRestaurantId = null;

    // Prefer direct restaurantId if provided and valid
    if (restaurantId && isValidRestaurantId(restaurantId)) {
      finalRestaurantId = parseInt(restaurantId, 10);
      logger.info('Order creation with direct restaurantId', { restaurantId: finalRestaurantId });
    }
    // Fallback to slug lookup
    else if (slug) {
      logger.info('Order creation with slug, mapping to restaurantId', { slug });
      finalRestaurantId = await getRestaurantIdBySlug(slug);

      if (!finalRestaurantId) {
        logger.warn('Restaurant not found for slug', { slug });
        return res.status(404).json({ message: "Restaurant not found" });
      }
    } else {
      logger.warn('Order creation without restaurantId or slug');
      return res.status(400).json({ message: "Restaurant ID or slug is required" });
    }

    // Validate table number format (security check)
    if (tableNumber && !/^[a-zA-Z0-9\-_]+$/.test(tableNumber)) {
      console.warn('[SECURITY] Invalid table number format:', tableNumber);
      return res.status(400).json({
        message: "Invalid table number format",
        error: "Table number must be alphanumeric"
      });
    }

    // Validate items array
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Order must contain at least one item" });
    }

    // Validate payment method if provided
    if (paymentMethod && !["cash", "card", "upi"].includes(paymentMethod)) {
      return res.status(400).json({ message: "Invalid payment method" });
    }

    // Log customer access for analytics
    console.log(`[ORDER] Restaurant ${finalRestaurantId}, Table: ${tableNumber || tableId}`);

    // CORE FIX: Get restaurant info using restaurantId (primary key)
    const restaurant = await Restaurant.findByPk(finalRestaurantId);
    if (!restaurant) {
      logger.error('Restaurant not found', { restaurantId: finalRestaurantId });
      return res.status(404).json({ message: "Restaurant not found" });
    }
    const taxPercentage = restaurant.taxPercentage || 5.0; // Default 5% if not set

    // If tableId is provided, verify it exists and get the table info
    let finalTableId = tableId;
    let finalTableNumber = tableNumber;

    if (tableId) {
      const table = await Table.findOne({
        where: {
          tableId,
          restaurantId: finalRestaurantId
        }
      });
      if (table) {
        if (!table.isActive) {
          return res.status(400).json({ message: `Table ${tableId} is not active` });
        }
        finalTableId = table.tableId;
        finalTableNumber = parseInt(table.tableId.replace(/\D/g, "")) || tableNumber || 1;
      } else {
        finalTableId = tableId;
        finalTableNumber = parseInt(tableId.replace(/\D/g, "")) || tableNumber || 1;
      }
    } else {
      finalTableId = `T${tableNumber || 1}`;
      finalTableNumber = tableNumber || 1;
    }

    // Generate unique order number for this restaurant
    // Use restaurant ID prefix + timestamp + random to ensure uniqueness
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const orderNumber = `R${finalRestaurantId}_${timestamp}_${random}`;
    // Calculate subtotal and update inventory
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const menuItem = await MenuItem.findOne({
        where: {
          id: item.menuItemId,
          restaurantId: finalRestaurantId
        }
      });
      if (!menuItem) {
        return res.status(404).json({ message: `Menu item ${item.name} not found` });
      }

      if (!menuItem.available || menuItem.inventoryCount < item.quantity) {
        return res.status(400).json({
          message: `${menuItem.name} is not available or insufficient stock`,
        });
      }

      menuItem.inventoryCount -= item.quantity;
      await menuItem.save();

      subtotal += parseFloat(menuItem.price) * item.quantity;
      orderItems.push({
        menuItemId: menuItem.id,
        name: menuItem.name,
        quantity: item.quantity,
        price: parseFloat(menuItem.price),
        specialInstructions: item.specialInstructions || "",
      });
    }

    // Validate and apply promo code
    let discount = 0;
    let promoCodeApplied = null;
    if (promoCode) {
      const promo = await PromoCode.findOne({
        where: {
          code: promoCode.toUpperCase(),
          restaurantId: finalRestaurantId,
        },
      });

      if (promo && promo.isValid()) {
        // Check minimum order amount
        if (subtotal >= promo.minOrderAmount) {
          discount = (subtotal * promo.discountPercentage) / 100;
          promoCodeApplied = {
            code: promo.code,
            discountPercentage: parseFloat(promo.discountPercentage),
            discountAmount: parseFloat(discount.toFixed(2)),
          };
          // Increment usage count
          promo.usedCount += 1;
          await promo.save();
        } else {
          return res.status(400).json({
            message: `Minimum order amount of ₹${promo.minOrderAmount} required for this promo code`,
          });
        }
      } else {
        return res.status(400).json({ message: "Invalid or expired promo code" });
      }
    }

    // Calculate tax and total
    const amountAfterDiscount = subtotal - discount;
    const taxAmount = (amountAfterDiscount * taxPercentage) / 100;
    const totalAmount = amountAfterDiscount + taxAmount;

    const orderData = {
      restaurantId: finalRestaurantId, // Use restaurantId resolved from slug or direct ID
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
      // For cash/card: pending (will pay at counter/delivery)
      // For UPI: pending (will be updated via payment gateway webhook)
      paymentStatus: "pending",
    };

    let order;
    if (SAVE_ORDERS) {
      order = await Order.create(orderData);
      console.log(`[ORDERS] ✓ Order saved for ${"single-tenant"}: ${order.orderNumber}`);
    } else {
      order = {
        ...orderData,
        id: `temp-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      logger.info("Order processing transient", { orderNumber: order.orderNumber });
    }

    // Emit socket event for new order to restaurant-specific rooms
    const io = req.app.get("io");
    const restaurantRoom = getRestaurantRoom(finalRestaurantId);
    const kitchenRoom = getKitchenRoom(finalRestaurantId);
    const captainRoom = getCaptainRoom(finalRestaurantId);
    const orderRoom = `order_${order.id}`; // Customer-specific order room

    // Broadcast to all relevant rooms including customer order room
    io.to(restaurantRoom).emit("new-order", order);
    io.to(kitchenRoom).emit("new-order", order);
    io.to(captainRoom).emit("new-order", order);
    io.to(orderRoom).emit("order-updated", order); // Notify customer

    logger.orderFlow("New order created and broadcasted", {
      orderId: order.id,
      orderNumber: order.orderNumber,
      restaurantId: finalRestaurantId,
      rooms: [restaurantRoom, kitchenRoom, captainRoom, orderRoom],
    });

    // Send invoice via Email if email provided and order was saved
    if (SAVE_ORDERS && customerEmail && order.id) {
      try {
        const orderDetails = {
          orderNumber: order.orderNumber,
          createdAt: order.createdAt,
          tableNumber: order.tableNumber,
          items: order.items,
          subtotal: order.totalAmount,
          discount: 0,
          tax: order.totalAmount * 0.09,
          total: order.totalAmount * 1.09,
          paymentMethod: order.paymentMethod,
          paymentStatus: order.paymentStatus
        };

        const result = await sendInvoiceViaEmail(customerEmail, orderDetails, 1);
        if (result.success) {
          console.log(`[INVOICE] ✅ Email invoice sent to ${customerEmail}`);
        }
      } catch (invoiceError) {
        console.error("[INVOICE] ❌ Failed to send email invoice:", invoiceError.message);
      }
    } else if (SAVE_ORDERS && customerPhone && order.id) {
      try {
        const orderDetails = {
          orderNumber: order.orderNumber,
          createdAt: order.createdAt,
          tableNumber: order.tableNumber,
          items: order.items,
          subtotal: order.totalAmount,
          discount: 0,
          tax: order.totalAmount * 0.09,
          total: order.totalAmount * 1.09,
          paymentMethod: order.paymentMethod,
          paymentStatus: order.paymentStatus
        };

        const result = await sendInvoiceViaWhatsApp(customerPhone, orderDetails, 1);
        if (result.success) {
          console.log(`[INVOICE] ✅ WhatsApp invoice sent to ${customerPhone}`);
        }
      } catch (invoiceError) {
        console.error("[INVOICE] ❌ Failed to send WhatsApp invoice:", invoiceError.message);
      }
    }

    res.status(201).json(order);
  } catch (error) {
    console.error("[ORDERS] Error creating order:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Fetch active orders for kitchen/admin
router.get("/active", authenticateRestaurant, enforceTenantIsolation, requirePermission('read:orders'), async (req, res) => {
  try {
    const whereClause = {
      restaurantId: req.restaurantId,
      status: {
        [Op.in]: ["pending", "preparing", "ready", "prepared", "served", "completed"],
      },
      createdAt: {
        [Op.gte]: new Date(new Date() - 10 * 24 * 60 * 60 * 1000), // Last 10 days
      },
    };

    console.log(`[ORDERS] Fetching active orders for restaurantId: ${req.restaurantId}`);

    // Check if saving is enabled
    if (!SAVE_ORDERS) {
      console.log('[ORDERS] SAVE_ORDERS is false, returning empty array');
      return res.json([]);
    }

    const orders = await Order.findAll({
      where: whereClause,
      order: [["createdAt", "DESC"]], // Newest first
    });

    console.log(`[ORDERS] Found ${orders.length} active orders`);
    res.json(orders);
  } catch (error) {
    console.error("[ORDERS] Error fetching active orders:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Update order status with lifecycle validation
router.put("/:id/status", authenticateRestaurant, enforceTenantIsolation, requirePermission('update:order_status'), async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    let order;

    if (SAVE_ORDERS) {
      order = await Order.findOne({
        where: {
          id: req.params.id,
          restaurantId: req.restaurantId
        }
      });

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Validate status transition
      try {
        validateStatusTransition(order.status, status, order.orderNumber);
      } catch (validationError) {
        logger.warn("Status transition validation failed", {
          orderId: order.id,
          orderNumber: order.orderNumber,
          error: validationError.message,
        });
        return res.status(400).json({
          message: validationError.message,
          currentStatus: order.status,
        });
      }

      // Update order status
      const oldStatus = order.status;
      await order.update({ status });

      logger.orderFlow("Order status updated", {
        orderId: order.id,
        orderNumber: order.orderNumber,
        from: oldStatus,
        to: status,
        restaurantId: req.restaurantId,
      });
    } else {
      order = {
        id: req.params.id,
        status,
        updatedAt: new Date(),
        restaurantId: req.restaurantId,
      };
    }

    // Emit socket event for order update to restaurant-specific rooms
    const io = req.app.get("io");
    const restaurantRoom = getRestaurantRoom(req.restaurantId);
    const kitchenRoom = getKitchenRoom(req.restaurantId);
    const captainRoom = getCaptainRoom(req.restaurantId);
    const orderRoom = `order_${order.id}`; // Customer-specific order room

    // Broadcast to all relevant rooms including customer order room
    io.to(restaurantRoom).emit("order-updated", order);
    io.to(kitchenRoom).emit("order-updated", order);
    io.to(captainRoom).emit("order-updated", order);
    io.to(orderRoom).emit("order-updated", order); // Notify customer

    logger.info("Socket.IO events emitted for order update", {
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      rooms: [restaurantRoom, kitchenRoom, captainRoom, orderRoom],
    });

    console.log(`[ORDER-UPDATE] ✅ Status updated: Order ${order.id} -> ${order.status}`);
    console.log(`[ORDER-UPDATE] 📡 Broadcasted to rooms:`, {
      restaurant: restaurantRoom,
      kitchen: kitchenRoom,
      captain: captainRoom
    });

    res.json(order);
  } catch (error) {
    logger.error("Error updating order status", {
      orderId: req.params.id,
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get single order - Public endpoint for customers to check their order status
router.get("/:id", async (req, res) => {
  try {
    if (!SAVE_ORDERS) {
      return res.status(404).json({ message: "Order not found (persistence disabled)" });
    }

    // Find order by ID without restaurant authentication
    // This allows customers to check their order status
    const order = await Order.findByPk(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    res.json(order);
  } catch (error) {
    console.error(`[ORDER] Error fetching order ${req.params.id}:`, error);
    console.error(error.stack);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Download invoice for an order
router.get("/:id/invoice/download", authenticateRestaurant, enforceTenantIsolation, requirePermission('read:orders'), async (req, res) => {
  try {
    if (!SAVE_ORDERS) {
      return res.status(404).json({ message: "Invoice not available (persistence disabled)" });
    }


    const order = await Order.findOne({
      where: {
        id: req.params.id,
        restaurantId: req.restaurantId
      }
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Get restaurant details
    const restaurant = await Restaurant.findByPk(req.restaurantId);

    // Prepare order details for invoice
    const orderDetails = {
      orderNumber: order.orderNumber,
      createdAt: order.createdAt,
      tableNumber: order.tableNumber,
      items: order.items,
      subtotal: order.totalAmount,
      discount: 0,
      tax: order.totalAmount * 0.09,
      total: order.totalAmount * 1.09,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus
    };

    // Generate invoice HTML
    const { generateHTMLInvoice } = await import("../services/invoiceService.js");
    const htmlContent = generateHTMLInvoice(orderDetails, restaurant);

    // Set headers for HTML download
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${order.orderNumber}.html"`);
    res.send(htmlContent);

  } catch (error) {
    console.error('[INVOICE DOWNLOAD] Error:', error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Download PDF invoice - PUBLIC endpoint for customers
router.get("/:id/invoice/pdf", async (req, res) => {
  try {
    console.log('[PDF INVOICE] Request for order ID:', req.params.id);

    const order = await Order.findByPk(req.params.id);

    if (!order) {
      console.log('[PDF INVOICE] Order not found:', req.params.id);
      return res.status(404).json({ message: "Order not found" });
    }

    console.log('[PDF INVOICE] Order found:', order.orderNumber);

    // Get restaurant details
    const restaurant = await Restaurant.findByPk(order.restaurantId);
    console.log('[PDF INVOICE] Restaurant:', restaurant?.name);

    // Prepare order data for PDF
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

    // Import PDF service dynamically
    const { generateInvoicePDFBuffer } = await import('../services/pdfInvoiceService.js');

    console.log('[PDF INVOICE] Generating PDF for order:', order.orderNumber);

    // Generate PDF buffer
    const pdfBuffer = await generateInvoicePDFBuffer(orderData);

    console.log('[PDF INVOICE] PDF generated, buffer size:', pdfBuffer.length, 'bytes');

    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${order.orderNumber}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    console.log('[PDF INVOICE] Sending PDF to client');
    res.send(pdfBuffer);

  } catch (error) {
    console.error('[PDF INVOICE] Error:', error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;
