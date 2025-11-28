import express from "express";
import { Op } from "sequelize";
import { optionalRestaurantAuth } from "../middleware/auth.js";
import { sendInvoiceViaWhatsApp, sendInvoiceViaEmail } from "../services/invoiceService.js";
// import { tenantMiddleware } from "../middleware/tenantMiddleware.js";
import Restaurant from "../models/Restaurant.js";
import Order from "../models/Order.js";
import MenuItem from "../models/MenuItem.js";
import Table from "../models/Table.js";
import PromoCode from "../models/PromoCode.js";

const router = express.Router();

// TEMPORARILY DISABLED: Apply tenant middleware to all routes
// router.use(tenantMiddleware);

// Toggle to control whether orders are persisted to DB. Set SAVE_ORDERS=true to enable saves.
const SAVE_ORDERS = process.env.SAVE_ORDERS === "true";

// Get all active orders (not delivered or cancelled)
router.get("/active", async (req, res) => {
  try {
    if (!SAVE_ORDERS) {
      return res.json([]);
    }
    
    
    
    const whereClause = {
      status: {
        [Op.in]: ["pending", "preparing", "prepared"],
      },
    };
    
    const orders = await Order.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
    });
    
    console.log(`[ORDERS] Retrieved ${orders.length} active orders for ${"single-tenant"}`);
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get all orders
router.get("/", async (req, res) => {
  try {
    if (!SAVE_ORDERS) {
      return res.json([]);
    }
    
    
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

    const orders = await Order.findAll({
      where: filter,
      order: [['createdAt', 'DESC']],
    });
    
    console.log(`[ORDERS] Retrieved ${orders.length} orders for ${"single-tenant"}`);
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
router.post("/", async (req, res) => {
  try {
    
    const { tableNumber, tableId, items, customerPhone, customerEmail, paymentMethod, promoCode } = req.body;

    // Validate payment method if provided
    if (paymentMethod && !["cash", "card", "upi"].includes(paymentMethod)) {
      return res.status(400).json({ message: "Invalid payment method" });
    }

    // Get restaurant info for tax percentage
    const restaurant = await Restaurant.findByPk(1); // Single tenant mode
    const taxPercentage = restaurant?.taxPercentage || 5.0; // Default 5% if not set

    // If tableId is provided, verify it exists and get the table info
    let finalTableId = tableId;
    let finalTableNumber = tableNumber;

    if (tableId) {
      const table = await Table.findOne({ where: { tableId } });
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
    const count = await Order.count();
    const orderNumber = `ORD${String(count + 1).padStart(5, "0")}`;

    // Calculate subtotal and update inventory
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const menuItem = await MenuItem.findByPk(item.menuItemId);
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
          restaurantId: 1,
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
      restaurantId: 1, // Single tenant mode - use restaurant ID 1
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
      paymentStatus: paymentMethod === "upi" ? "pending" : "pending",
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
      console.log(`[ORDERS] Order processing transient: ${order.orderNumber}`);
    }

    // Emit socket event for new order
    const io = req.app.get("io");
    console.log(`[SOCKET] Emitting new-order for ${"single-tenant"}:`, order.orderNumber);
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
router.get("/:id", async (req, res) => {
  try {
    if (!SAVE_ORDERS) {
      return res.status(404).json({ message: "Order not found (persistence disabled)" });
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

// Download PDF invoice
router.get("/:id/invoice/pdf", async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Get restaurant details
    const restaurant = await Restaurant.findByPk(order.restaurantId);

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
    
    // Generate PDF buffer
    const pdfBuffer = await generateInvoicePDFBuffer(orderData);

    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${order.orderNumber}.pdf"`);
    res.send(pdfBuffer);

  } catch (error) {
    console.error('[PDF INVOICE] Error:', error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;
