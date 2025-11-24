import express from "express";
import { Op } from "sequelize";
import Order from "../models/Order.js";
import MenuItem from "../models/MenuItem.js";
import Table from "../models/Table.js";

const router = express.Router();
// Toggle to control whether orders are persisted to DB. Set SAVE_ORDERS=true to enable saves.
const SAVE_ORDERS = process.env.SAVE_ORDERS === "true";

// Get all active orders (not delivered or cancelled)
router.get("/active", async (req, res) => {
  try {
    if (!SAVE_ORDERS) {
      // Orders are not persisted — return empty list when persistence disabled
      return res.json([]);
    }
    const orders = await Order.findAll({
      where: {
        status: {
          [Op.in]: ["pending", "preparing", "prepared"],
        },
      },
      order: [['createdAt', 'DESC']],
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get all orders
router.get("/", async (req, res) => {
  try {
    if (!SAVE_ORDERS) {
      // Persistence disabled — no historical orders available
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
    const { tableNumber, tableId, items, customerPhone, paymentMethod } =
      req.body;

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
      items: orderItems,
      totalAmount,
      status: "preparing",
      paymentMethod: paymentMethod || "cash",
      paymentStatus: paymentMethod === "upi" ? "pending" : "pending",
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
    io.emit("new-order", order);

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

export default router;
