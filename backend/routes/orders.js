import express from "express";
import { Op } from "sequelize";
import { optionalRestaurantAuth } from "../middleware/auth.js";
import { sendInvoiceViaWhatsApp, sendInvoiceViaEmail } from "../services/invoiceService.js";
import { tenantMiddleware, requireTenant } from "../middleware/tenantMiddleware.js";
import Restaurant from "../models/Restaurant.js";

const router = express.Router();

// Apply tenant middleware to all routes
router.use(tenantMiddleware);

// Toggle to control whether orders are persisted to DB. Set SAVE_ORDERS=true to enable saves.
const SAVE_ORDERS = process.env.SAVE_ORDERS === "true";

// Get all active orders (not delivered or cancelled)
router.get("/active", requireTenant, async (req, res) => {
  try {
    if (!SAVE_ORDERS) {
      return res.json([]);
    }
    
    const { Order: TenantOrder } = req.tenant.models;
    
    const whereClause = {
      status: {
        [Op.in]: ["pending", "preparing", "prepared"],
      },
    };
    
    const orders = await TenantOrder.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
    });
    
    console.log(`[ORDERS] Retrieved ${orders.length} active orders for ${req.tenant.slug}`);
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get all orders
router.get("/", requireTenant, async (req, res) => {
  try {
    if (!SAVE_ORDERS) {
      return res.json([]);
    }
    
    const { Order: TenantOrder } = req.tenant.models;
    const { status, startDate, endDate, tableId } = req.query;
    
    const filter = {};

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

    const orders = await TenantOrder.findAll({
      where: filter,
      order: [['createdAt', 'DESC']],
    });
    
    console.log(`[ORDERS] Retrieved ${orders.length} orders for ${req.tenant.slug}`);
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get orders by tableId
router.get("/by-table/:tableId", requireTenant, async (req, res) => {
  try {
    if (!SAVE_ORDERS) {
      return res.json([]);
    }
    
    const { Order: TenantOrder } = req.tenant.models;
    
    const orders = await TenantOrder.findAll({
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
router.post("/", requireTenant, async (req, res) => {
  try {
    const { Order: TenantOrder, MenuItem: TenantMenuItem, Table: TenantTable } = req.tenant.models;
    const { tableNumber, tableId, items, customerPhone, customerEmail, paymentMethod } = req.body;

    // Validate payment method if provided
    if (paymentMethod && !["cash", "card", "upi"].includes(paymentMethod)) {
      return res.status(400).json({ message: "Invalid payment method" });
    }

    // If tableId is provided, verify it exists and get the table info
    let finalTableId = tableId;
    let finalTableNumber = tableNumber;

    if (tableId) {
      const table = await TenantTable.findOne({ where: { tableId } });
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

    // Generate order number
    const count = await TenantOrder.count();
    const orderNumber = `ORD${String(count + 1).padStart(5, "0")}`;

    // Calculate total and update inventory
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const menuItem = await TenantMenuItem.findByPk(item.menuItemId);
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
    };

    let order;
    if (SAVE_ORDERS) {
      order = await TenantOrder.create(orderData);
      console.log(`[ORDERS] ✓ Order saved for ${req.tenant.slug}: ${order.orderNumber}`);
    } else {
      order = {
        ...orderData,
        id: `temp-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      console.log(`[ORDERS] Order processing transient: ${order.orderNumber}`);
    }

    // Emit socket event for new order
    const io = req.app.get("io");
    console.log(`[SOCKET] Emitting new-order for ${req.tenant.slug}:`, order.orderNumber);
    io.emit("new-order", order);

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

        const result = await sendInvoiceViaEmail(customerEmail, orderDetails, req.tenant.restaurant.id);
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

        const result = await sendInvoiceViaWhatsApp(customerPhone, orderDetails, req.tenant.restaurant.id);
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

// Update order status
router.put("/:id/status", requireTenant, async (req, res) => {
  try {
    const { Order: TenantOrder } = req.tenant.models;
    const { status } = req.body;
    let order;
    
    if (SAVE_ORDERS) {
      order = await TenantOrder.findByPk(req.params.id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      await order.update({ status });
    } else {
      order = {
        id: req.params.id,
        status,
        updatedAt: new Date(),
      };
    }

    // Emit socket event for order update
    const io = req.app.get("io");
    io.emit("order-updated", order);

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get single order
router.get("/:id", requireTenant, async (req, res) => {
  try {
    if (!SAVE_ORDERS) {
      return res.status(404).json({ message: "Order not found (persistence disabled)" });
    }

    const { Order: TenantOrder } = req.tenant.models;
    const order = await TenantOrder.findByPk(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Download invoice for an order
router.get("/:id/invoice/download", requireTenant, async (req, res) => {
  try {
    if (!SAVE_ORDERS) {
      return res.status(404).json({ message: "Invoice not available (persistence disabled)" });
    }

    const { Order: TenantOrder } = req.tenant.models;
    const order = await TenantOrder.findByPk(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Use restaurant from tenant context
    const restaurant = req.tenant.restaurant;

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

export default router;
