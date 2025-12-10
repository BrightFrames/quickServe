import express from "express";
import jwt from "jsonwebtoken";
import { Op } from "sequelize";
import Table from "../models/Table.js";
import MenuItem from "../models/MenuItem.js";
import Order from "../models/Order.js";
import Restaurant from "../models/Restaurant.js";

const router = express.Router();

/**
 * Middleware to resolve restaurant slug to ID
 * Converts :restaurantSlug param to restaurantId and validates access
 * MUST be called AFTER authenticateCaptain
 */
const resolveRestaurantSlug = async (req, res, next) => {
  try {
    const { restaurantSlug } = req.params;
    
    if (!restaurantSlug) {
      return res.status(400).json({ 
        message: 'Restaurant slug is required',
        error: 'Missing restaurantSlug parameter'
      });
    }

    const restaurant = await Restaurant.findOne({ where: { slug: restaurantSlug } });
    
    if (!restaurant) {
      return res.status(404).json({ 
        message: 'Restaurant not found',
        error: `No restaurant found with slug: ${restaurantSlug}`
      });
    }

    // CRITICAL: Validate captain can ONLY access their assigned restaurant
    // req.restaurantId comes from JWT token (set by authenticateCaptain middleware)
    if (!req.restaurantId) {
      return res.status(401).json({ 
        message: 'Authentication required',
        error: 'Captain restaurant ID not found in token'
      });
    }

    if (parseInt(restaurant.id) !== parseInt(req.restaurantId)) {
      console.log(`[SLUG RESOLVER] ✗ ACCESS DENIED: Captain ${req.username} (RestaurantID: ${req.restaurantId}) tried to access ${restaurantSlug} (RestaurantID: ${restaurant.id})`);
      return res.status(403).json({ 
        message: 'Access denied',
        error: `You can only access your assigned restaurant. Your restaurant ID: ${req.restaurantId}, Requested: ${restaurant.id}`
      });
    }

    req.resolvedRestaurantId = restaurant.id;
    req.restaurantName = restaurant.name;
    
    console.log(`[SLUG RESOLVER] ✓ ${req.username} (RestaurantID: ${req.restaurantId}) → ${restaurantSlug} (ID: ${restaurant.id}) ALLOWED`);
    next();
  } catch (error) {
    console.error('[SLUG RESOLVER] Error:', error.message);
    return res.status(500).json({ 
      message: 'Failed to resolve restaurant',
      error: error.message
    });
  }
};

/**
 * Middleware to authenticate captain users
 * Extracts restaurantId from captain JWT token
 */
const authenticateCaptain = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ 
        message: 'Authentication required',
        error: 'No authorization header provided'
      });
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        message: 'Authentication required',
        error: 'Invalid authorization header format'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verify user is captain and has restaurantId
    if (decoded.role !== 'captain') {
      return res.status(403).json({ 
        message: 'Access denied',
        error: 'Only captains can access this endpoint'
      });
    }

    if (!decoded.restaurantId) {
      return res.status(403).json({ 
        message: 'Access denied',
        error: 'No restaurant assigned to this captain'
      });
    }

    req.captainId = decoded.id;
    req.restaurantId = decoded.restaurantId;
    req.username = decoded.username;
    
    console.log(`[CAPTAIN AUTH] ✓ Captain authenticated: ${req.username} (Restaurant: ${req.restaurantId})`);
    next();
  } catch (error) {
    console.error('[CAPTAIN AUTH] Error:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: 'Invalid token',
        error: 'Token is malformed or invalid'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Token expired',
        error: 'Please login again'
      });
    }
    
    return res.status(401).json({ 
      message: 'Authentication failed',
      error: error.message
    });
  }
};

// Get all tables for captain's restaurant
router.get("/tables/:restaurantSlug", authenticateCaptain, resolveRestaurantSlug, async (req, res) => {
  try {
    const restaurantId = req.resolvedRestaurantId;
    
    console.log(`[CAPTAIN TABLES] Querying tables with:`, {
      slug: req.params.restaurantSlug,
      restaurantId: restaurantId,
      requestedBy: req.username,
      captainRestaurantId: req.restaurantId
    });

    const tables = await Table.findAll({
      where: { 
        restaurantId: restaurantId,
        isActive: true // Only show active tables to captains
      },
      order: [['tableId', 'ASC']],
    });
    
    console.log(`[CAPTAIN TABLES] Raw tables from DB:`, tables.map(t => ({
      id: t.id,
      tableId: t.tableId,
      tableName: t.tableName,
      restaurantId: t.restaurantId,
      isActive: t.isActive
    })));
    
    // Get active orders to determine table status
    const activeOrders = await Order.findAll({
      where: {
        restaurantId: parseInt(restaurantId),
        status: {
          [Op.in]: ['pending', 'preparing', 'ready']
        }
      },
      attributes: ['tableNumber']
    });
    
    const occupiedTableNumbers = new Set(activeOrders.map(order => order.tableNumber));
    console.log(`[CAPTAIN TABLES] Occupied table numbers:`, Array.from(occupiedTableNumbers));
    
    // Transform to match captain's expected format with real-time status
    const formattedTables = tables.map(table => {
      const tableNumber = parseInt(table.tableId.replace(/\D/g, '')) || table.id;
      const isOccupied = occupiedTableNumbers.has(tableNumber);
      
      return {
        id: table.id,
        tableNumber: tableNumber,
        tableName: table.tableName,
        capacity: table.seats,
        status: isOccupied ? 'occupied' : 'available',
        restaurantId: table.restaurantId
      };
    });
    
    console.log(`[CAPTAIN TABLES] ✓ Sending ${formattedTables.length} tables to captain`);
    console.log(`[CAPTAIN TABLES] Formatted tables:`, formattedTables);
    res.json(formattedTables);
  } catch (error) {
    console.error('[CAPTAIN] Error fetching tables:', error);
    res.status(500).json({ 
      message: "Failed to load tables", 
      error: error.message 
    });
  }
});

// Free up a table (mark all its orders as completed/cancelled)
router.post("/tables/:restaurantSlug/free/:tableNumber", authenticateCaptain, resolveRestaurantSlug, async (req, res) => {
  try {
    const { tableNumber } = req.params;
    const restaurantId = req.resolvedRestaurantId;
    
    console.log(`[CAPTAIN FREE TABLE] Request to free table ${tableNumber} by ${req.username}`);
    
    // Update all active orders for this table to 'served' status
    const [updatedCount] = await Order.update(
      { 
        status: 'served',
        deliveredAt: new Date()
      },
      {
        where: {
          restaurantId: parseInt(restaurantId),
          tableNumber: parseInt(tableNumber),
          status: {
            [Op.in]: ['pending', 'preparing', 'ready']
          }
        }
      }
    );
    
    console.log(`[CAPTAIN FREE TABLE] ✓ Updated ${updatedCount} orders to served for table ${tableNumber}`);
    
    res.json({
      success: true,
      message: `Table ${tableNumber} freed successfully`,
      ordersCompleted: updatedCount
    });
  } catch (error) {
    console.error('[CAPTAIN FREE TABLE] Error:', error);
    res.status(500).json({ 
      message: "Failed to free table", 
      error: error.message 
    });
  }
});

// Get orders for a specific table (for billing)
router.get("/tables/:restaurantSlug/orders/:tableNumber", authenticateCaptain, resolveRestaurantSlug, async (req, res) => {
  try {
    const { tableNumber } = req.params;
    const restaurantId = req.resolvedRestaurantId;
    
    console.log(`[CAPTAIN BILLING] Fetching orders for table ${tableNumber}`);
    
    // Get restaurant tax percentage
    const restaurant = await Restaurant.findByPk(restaurantId);
    const taxPercentage = restaurant?.taxPercentage || 5.0; // Default 5% if not set
    
    // Only fetch ACTIVE orders (not completed)
    const orders = await Order.findAll({
      where: {
        restaurantId: parseInt(restaurantId),
        tableNumber: parseInt(tableNumber),
        status: {
          [Op.in]: ['pending', 'preparing', 'ready', 'served']
        },
        paymentStatus: {
          [Op.ne]: 'paid'
        }
      },
      order: [['createdAt', 'DESC']]
    });
    
    // Calculate proper totals if missing
    const ordersWithTotals = orders.map(order => {
      const orderData = order.toJSON();
      
      // Parse items if it's a string
      let items = orderData.items;
      if (typeof items === 'string') {
        try {
          items = JSON.parse(items);
        } catch (e) {
          items = [];
        }
      }
      
      // Calculate subtotal from items
      const calculatedSubtotal = items.reduce((sum, item) => {
        const price = parseFloat(item.price) || 0;
        const quantity = parseInt(item.quantity) || 0;
        return sum + (price * quantity);
      }, 0);
      
      // Use calculated subtotal if totalAmount is 0 or missing
      const subtotal = parseFloat(orderData.totalAmount) || calculatedSubtotal;
      const tax = subtotal * (taxPercentage / 100); // Use restaurant tax percentage
      const total = subtotal + tax;
      
      return {
        ...orderData,
        items,
        subtotal: subtotal.toFixed(2),
        tax: tax.toFixed(2),
        total: total.toFixed(2)
      };
    });
    
    console.log(`[CAPTAIN BILLING] Found ${ordersWithTotals.length} active orders for table ${tableNumber}, tax: ${taxPercentage}%`);
    
    res.json(ordersWithTotals);
  } catch (error) {
    console.error('[CAPTAIN BILLING] Error:', error);
    res.status(500).json({ 
      message: "Failed to fetch orders", 
      error: error.message 
    });
  }
});

// Mark table as paid (for cash payments)
router.post("/tables/:restaurantSlug/mark-paid/:tableNumber", authenticateCaptain, resolveRestaurantSlug, async (req, res) => {
  try {
    const { tableNumber } = req.params;
    const restaurantId = req.resolvedRestaurantId;
    
    console.log(`[CAPTAIN PAYMENT] Marking table ${tableNumber} as paid by ${req.username}`);
    
    // Update all orders for this table to completed status and paid
    const [updatedCount] = await Order.update(
      { 
        status: 'completed',
        paymentStatus: 'paid',
        paymentProcessedAt: new Date(),
        paymentProcessedBy: req.id
      },
      {
        where: {
          restaurantId: parseInt(restaurantId),
          tableNumber: parseInt(tableNumber),
          status: {
            [Op.in]: ['pending', 'preparing', 'ready', 'served']
          }
        }
      }
    );
    
    console.log(`[CAPTAIN PAYMENT] ✓ Marked ${updatedCount} orders as completed for table ${tableNumber}`);
    
    res.json({
      success: true,
      message: `Payment received for Table ${tableNumber}`,
      ordersUpdated: updatedCount
    });
  } catch (error) {
    console.error('[CAPTAIN PAYMENT] Error:', error);
    res.status(500).json({ 
      message: "Failed to process payment", 
      error: error.message 
    });
  }
});

// Get menu items for captain's restaurant
router.get("/menu/:restaurantSlug", authenticateCaptain, resolveRestaurantSlug, async (req, res) => {
  try {
    const restaurantId = req.resolvedRestaurantId;
    
    const menuItems = await MenuItem.findAll({
      where: { 
        restaurantId: parseInt(restaurantId),
        available: true // Only show available items
      },
      order: [['category', 'ASC'], ['name', 'ASC']],
    });
    
    console.log(`[CAPTAIN] Retrieved ${menuItems.length} menu items for restaurant ${restaurantId}`);
    
    // Log first item to verify restaurantId
    if (menuItems.length > 0) {
      console.log(`[CAPTAIN] Sample menu item:`, {
        id: menuItems[0].id,
        name: menuItems[0].name,
        restaurantId: menuItems[0].restaurantId,
        category: menuItems[0].category
      });
    }
    
    res.json(menuItems);
  } catch (error) {
    console.error('[CAPTAIN] Error fetching menu:', error);
    res.status(500).json({ 
      message: "Failed to load menu", 
      error: error.message 
    });
  }
});

export default router;
