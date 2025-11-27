import express from "express";
import { Op } from "sequelize";
import Order from "../models/Order.js";
import MenuItem from "../models/MenuItem.js";
import Table from "../models/Table.js";
import Restaurant from "../models/Restaurant.js";
import { optionalRestaurantAuth } from "../middleware/auth.js";
import { sendInvoiceViaWhatsApp, sendInvoiceViaEmail } from "../services/invoiceService.js";

const router = express.Router();
// Toggle to control whether orders are persisted to DB. Set SAVE_ORDERS=true to enable saves.
const SAVE_ORDERS = process.env.SAVE_ORDERS === "true";

// Get all active orders (not delivered or cancelled)
router.get("/active", optionalRestaurantAuth, async (req, res) => {
  try {
    if (!SAVE_ORDERS) {
      // Orders are not persisted — return empty list when persistence disabled
      return res.json([]);
    }
    
    const { slug } = req.query;
    let restaurantId = req.restaurantId;
    
    // Resolve restaurant from slug if provided
    if (slug) {
      const restaurant = await Restaurant.findOne({ where: { slug } });
      if (restaurant) {
        restaurantId = restaurant.id;
      }
    }
    
    const whereClause = {
      status: {
        [Op.in]: ["pending", "preparing", "prepared"],
      },
    };
    
    if (restaurantId) {
      whereClause.restaurantId = restaurantId;
    }
    
    const orders = await Order.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get all orders
router.get("/", optionalRestaurantAuth, async (req, res) => {
  try {
    if (!SAVE_ORDERS) {
      // Persistence disabled — no historical orders available
      return res.json([]);
    }
    const { status, startDate, endDate, tableId, slug } = req.query;
    let restaurantId = req.restaurantId;
    
    // Resolve restaurant from slug if provided
    if (slug) {
      const restaurant = await Restaurant.findOne({ where: { slug } });
      if (restaurant) {
        restaurantId = restaurant.id;
      }
    }
    
    const filter = {};
    
    if (restaurantId) {
      filter.restaurantId = restaurantId;
    }

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
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get orders by tableId
router.get("/by-table/:tableId", async (req, res) => {
  try {
    if (!SAVE_ORDERS) {
      return res.json([]);
    }
    const orders = await Order.findAll({
      where: {
        tableId: req.params.tableId,
      },
      order: [['createdAt', 'DESC']],
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Create order
router.post("/", optionalRestaurantAuth, async (req, res) => {
  try {
    const { tableNumber, tableId, items, customerPhone, customerEmail, paymentMethod, restaurantId: bodyRestaurantId, slug } =
      req.body;
      
    // Get restaurantId from token, query, body, or resolve from slug
    let restaurantId = req.restaurantId || bodyRestaurantId || req.query.restaurantId;
    
    // Resolve restaurant from slug if provided
    if (slug) {
      const restaurant = await Restaurant.findOne({ where: { slug } });
      if (restaurant) {
        restaurantId = restaurant.id;
      }
    }
    
    if (!restaurantId) {
      return res.status(400).json({ message: "Restaurant ID or slug is required" });
    }

    // Validate payment method if provided
    if (paymentMethod && !["cash", "card", "upi"].includes(paymentMethod)) {
      return res.status(400).json({ message: "Invalid payment method" });
    }

    // If tableId is provided, verify it exists and get the table info
    let finalTableId = tableId;
    let finalTableNumber = tableNumber;

    if (tableId) {
      // Try to find the table in the database
      const table = await Table.findOne({ where: { tableId } });
      if (table) {
        // Table exists in database, use its information
        if (!table.isActive) {
          return res
            .status(400)
            .json({ message: `Table ${tableId} is not active` });
        }
        finalTableId = table.tableId;
        // Extract number from tableId (e.g., T1 -> 1, T10 -> 10)
        finalTableNumber =
          parseInt(table.tableId.replace(/\D/g, "")) || tableNumber || 1;
      } else {
        // Table doesn't exist in database, but allow order anyway
        // This handles manual table entry or old orders
        finalTableId = tableId;
        finalTableNumber =
          parseInt(tableId.replace(/\D/g, "")) || tableNumber || 1;
      }
    } else {
      // For backward compatibility, if no tableId provided, use default
      finalTableId = `T${tableNumber || 1}`;
      finalTableNumber = tableNumber || 1;
    }

    // Generate order number
    const count = await Order.count();
    const orderNumber = `ORD${String(count + 1).padStart(5, "0")}`;

    // Calculate total and update inventory
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      console.log("Processing item:", item);
      const menuItem = await MenuItem.findByPk(item.menuItemId);
      console.log("Found menu item:", menuItem);
      if (!menuItem) {
        return res
          .status(404)
          .json({ message: `Menu item ${item.name} not found` });
      }

      if (!menuItem.available || menuItem.inventoryCount < item.quantity) {
        return res.status(400).json({
          message: `${menuItem.name} is not available or insufficient stock`,
        });
      }

      // Update inventory
      menuItem.inventoryCount -= item.quantity;
      await menuItem.save();

      totalAmount += parseFloat(menuItem.price) * item.quantity;
      orderItems.push({
        menuItemId: menuItem.id,
        name: menuItem.name,
        quantity: item.quantity,
        price: parseFloat(menuItem.price),
        specialInstructions: item.specialInstructions || "",
      });
    }

    const orderData = {
      orderNumber,
      tableId: finalTableId,
      tableNumber: finalTableNumber,
      customerPhone,
      customerEmail,
      items: orderItems,
      totalAmount,
      status: "preparing",
      paymentMethod: paymentMethod || "cash",
      paymentStatus: paymentMethod === "upi" ? "pending" : "pending",
      restaurantId: restaurantId,
    };

    let order;
    // Persist order only when SAVE_ORDERS is enabled. Otherwise keep it transient.
    if (SAVE_ORDERS) {
      order = await Order.create(orderData);
      console.log(
        "Order saved to DB:",
        order.id,
        "orderNumber:",
        order.orderNumber
      );
    } else {
      // Ensure transient order has timestamps
      order = {
        ...orderData,
        id: `temp-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      console.log("Order processing transient (not saved):", order.orderNumber);
    }

    // Emit socket event for new order
    const io = req.app.get("io");
    console.log("[SOCKET] Emitting new-order event:", {
      orderNumber: order.orderNumber,
      tableNumber: order.tableNumber,
      status: order.status
    });
    io.emit("new-order", order);

    // Send invoice via Email if email provided and order was saved
    if (SAVE_ORDERS && customerEmail && order.id) {
      try {
        console.log(`[INVOICE] Attempting to send email invoice for order ${order.id} to ${customerEmail}`);
        console.log(`[INVOICE] Order restaurantId: ${order.restaurantId}`);
        
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

        const result = await sendInvoiceViaEmail(customerEmail, orderDetails, order.restaurantId);
        if (result.success) {
          console.log(`[INVOICE] ✅ Email invoice sent successfully to ${customerEmail}`);
        } else {
          console.log(`[INVOICE] ⚠️ Email invoice send failed: ${result.message}`);
        }
      } catch (invoiceError) {
        console.error("[INVOICE] ❌ Failed to send email invoice:", invoiceError.message);
      }
    } else if (SAVE_ORDERS && customerPhone && order.id) {
      // Fallback to WhatsApp if only phone provided
      try {
        console.log(`[INVOICE] Attempting to send WhatsApp invoice for order ${order.id} to ${customerPhone}`);
        console.log(`[INVOICE] Order restaurantId: ${order.restaurantId}`);
        
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

        const result = await sendInvoiceViaWhatsApp(customerPhone, orderDetails, order.restaurantId);
        if (result.success) {
          console.log(`[INVOICE] ✅ WhatsApp invoice sent successfully to ${customerPhone}`);
        } else {
          console.log(`[INVOICE] ⚠️ WhatsApp invoice send failed: ${result.message}`);
        }
      } catch (invoiceError) {
        console.error("[INVOICE] ❌ Failed to send WhatsApp invoice:", invoiceError.message);
      }
    } else {
      console.log(`[INVOICE] Skipping invoice send - SAVE_ORDERS: ${SAVE_ORDERS}, customerEmail: ${customerEmail}, customerPhone: ${customerPhone}, order.id: ${order.id}`);
    }

    res.status(201).json(order);
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Update order status
router.put("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    let order;
    if (SAVE_ORDERS) {
      order = await Order.findByPk(req.params.id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      await order.update({ status });
    } else {
      // Persistence disabled — construct a transient order object to emit
      order = {
        id: req.params.id,
        status,
        updatedAt: new Date(),
      };
    }

    // Emit socket event for order update (transient or persisted)
    const io = req.app.get("io");
    io.emit("order-updated", order);

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get single order
router.get("/:id", async (req, res) => {
  try {
    if (!SAVE_ORDERS) {
      return res
        .status(404)
        .json({ message: "Order not found (persistence disabled)" });
    }

    const order = await Order.findByPk(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Download invoice for an order
router.get("/:id/invoice/download", async (req, res) => {
  try {
    if (!SAVE_ORDERS) {
      return res.status(404).json({ message: "Invoice not available (persistence disabled)" });
    }

    const order = await Order.findByPk(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Get restaurant details
    const restaurant = await Restaurant.findByPk(order.restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

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

    // Generate invoice HTML (reuse from invoiceService)
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

export default router;
