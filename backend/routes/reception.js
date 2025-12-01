import express from "express";
import jwt from "jsonwebtoken";
import Order from "../models/Order.js";
import Table from "../models/Table.js";
import MenuItem from "../models/MenuItem.js";

const router = express.Router();

/**
 * Middleware to authenticate reception users
 */
const authenticateReception = (req, res, next) => {
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
    
    // Verify user is reception
    if (decoded.role !== 'reception') {
      return res.status(403).json({ 
        message: 'Access denied',
        error: 'Only reception staff can access this endpoint'
      });
    }

    if (!decoded.restaurantId) {
      return res.status(403).json({ 
        message: 'Access denied',
        error: 'No restaurant assigned'
      });
    }

    req.receptionId = decoded.id;
    req.restaurantId = decoded.restaurantId;
    req.username = decoded.username;
    
    console.log(`[RECEPTION AUTH] ✓ Reception authenticated: ${req.username} (Restaurant: ${req.restaurantId})`);
    next();
  } catch (error) {
    console.error('[RECEPTION AUTH] Error:', error.message);
    
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

// Get all tables with their current order status
router.get("/tables/:restaurantId", authenticateReception, async (req, res) => {
  try {
    const { restaurantId } = req.params;
    
    // Verify reception is accessing their own restaurant
    if (parseInt(restaurantId) !== req.restaurantId) {
      return res.status(403).json({ 
        message: 'Access denied',
        error: 'You can only view tables from your assigned restaurant'
      });
    }
    
    // Get all tables
    const tables = await Table.findAll({
      where: { 
        restaurantId: parseInt(restaurantId),
        isActive: true
      },
      order: [['tableId', 'ASC']],
    });
    
    // Get active orders for each table
    const tablesWithOrders = await Promise.all(
      tables.map(async (table) => {
        const activeOrders = await Order.findAll({
          where: {
            restaurantId: parseInt(restaurantId),
            tableNumber: table.tableId,
            status: ['pending', 'preparing', 'ready']
          },
          order: [['createdAt', 'DESC']]
        });

        return {
          id: table.id,
          tableId: table.tableId,
          tableName: table.tableName,
          seats: table.seats,
          location: table.location,
          activeOrders: activeOrders.length,
          hasActiveOrders: activeOrders.length > 0,
          latestOrderTime: activeOrders[0]?.createdAt || null
        };
      })
    );
    
    console.log(`[RECEPTION] Retrieved ${tablesWithOrders.length} tables for restaurant ${restaurantId}`);
    res.json(tablesWithOrders);
  } catch (error) {
    console.error('[RECEPTION] Error fetching tables:', error);
    res.status(500).json({ 
      message: "Failed to load tables", 
      error: error.message 
    });
  }
});

// Get orders for a specific table
router.get("/table-orders/:restaurantId/:tableId", authenticateReception, async (req, res) => {
  try {
    const { restaurantId, tableId } = req.params;
    
    // Verify reception is accessing their own restaurant
    if (parseInt(restaurantId) !== req.restaurantId) {
      return res.status(403).json({ 
        message: 'Access denied',
        error: 'You can only view orders from your assigned restaurant'
      });
    }
    
    // Get all orders for this table (including completed for history)
    const orders = await Order.findAll({
      where: {
        restaurantId: parseInt(restaurantId),
        tableNumber: tableId
      },
      order: [['createdAt', 'DESC']],
      limit: 50 // Last 50 orders
    });
    
    console.log(`[RECEPTION] Retrieved ${orders.length} orders for table ${tableId}`);
    res.json(orders);
  } catch (error) {
    console.error('[RECEPTION] Error fetching table orders:', error);
    res.status(500).json({ 
      message: "Failed to load orders", 
      error: error.message 
    });
  }
});

// Process payment and mark orders as completed
router.post("/process-payment", authenticateReception, async (req, res) => {
  try {
    const { orderIds, paymentMethod, restaurantId } = req.body;
    
    // Verify reception is processing payment for their own restaurant
    if (parseInt(restaurantId) !== req.restaurantId) {
      return res.status(403).json({ 
        message: 'Access denied',
        error: 'You can only process payments for your assigned restaurant'
      });
    }

    console.log(`[RECEPTION] Processing payment for ${orderIds.length} orders with method: ${paymentMethod}`);
    
    // Update all orders
    await Order.update(
      { 
        status: 'completed',
        paymentMethod: paymentMethod,
        paymentProcessedAt: new Date(),
        paymentProcessedBy: req.receptionId
      },
      {
        where: {
          id: orderIds,
          restaurantId: parseInt(restaurantId)
        }
      }
    );
    
    console.log(`[RECEPTION] Payment processed successfully for orders:`, orderIds);
    res.json({ 
      message: 'Payment processed successfully',
      orderIds: orderIds,
      paymentMethod: paymentMethod
    });
  } catch (error) {
    console.error('[RECEPTION] Error processing payment:', error);
    res.status(500).json({ 
      message: "Failed to process payment", 
      error: error.message 
    });
  }
});

// Get all active orders across all tables
router.get("/active-orders/:restaurantId", authenticateReception, async (req, res) => {
  try {
    const { restaurantId } = req.params;
    
    // Verify reception is accessing their own restaurant
    if (parseInt(restaurantId) !== req.restaurantId) {
      return res.status(403).json({ 
        message: 'Access denied'
      });
    }
    
    const activeOrders = await Order.findAll({
      where: {
        restaurantId: parseInt(restaurantId),
        status: ['pending', 'preparing', 'ready']
      },
      order: [['createdAt', 'DESC']]
    });
    
    console.log(`[RECEPTION] Retrieved ${activeOrders.length} active orders`);
    res.json(activeOrders);
  } catch (error) {
    console.error('[RECEPTION] Error fetching active orders:', error);
    res.status(500).json({ 
      message: "Failed to load active orders", 
      error: error.message 
    });
  }
});

export default router;
