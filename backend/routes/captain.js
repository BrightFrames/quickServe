import express from "express";
import jwt from "jsonwebtoken";
import Table from "../models/Table.js";
import MenuItem from "../models/MenuItem.js";

const router = express.Router();

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
router.get("/tables/:restaurantId", authenticateCaptain, async (req, res) => {
  try {
    const { restaurantId } = req.params;
    
    // Verify captain is accessing their own restaurant's tables
    if (parseInt(restaurantId) !== req.restaurantId) {
      return res.status(403).json({ 
        message: 'Access denied',
        error: 'You can only view tables from your assigned restaurant'
      });
    }
    
    const tables = await Table.findAll({
      where: { 
        restaurantId: parseInt(restaurantId),
        isActive: true // Only show active tables to captains
      },
      order: [['tableId', 'ASC']],
    });
    
    // Transform to match captain's expected format
    const formattedTables = tables.map(table => ({
      id: table.id,
      tableNumber: parseInt(table.tableId.replace('t', '')) || table.id,
      tableName: table.tableName,
      capacity: table.seats,
      status: 'available', // TODO: Get actual status from orders
      restaurantId: table.restaurantId
    }));
    
    console.log(`[CAPTAIN] Retrieved ${formattedTables.length} tables for restaurant ${restaurantId}`);
    res.json(formattedTables);
  } catch (error) {
    console.error('[CAPTAIN] Error fetching tables:', error);
    res.status(500).json({ 
      message: "Failed to load tables", 
      error: error.message 
    });
  }
});

// Get menu items for captain's restaurant
router.get("/menu/:restaurantId", authenticateCaptain, async (req, res) => {
  try {
    const { restaurantId } = req.params;
    
    // Verify captain is accessing their own restaurant's menu
    if (parseInt(restaurantId) !== req.restaurantId) {
      return res.status(403).json({ 
        message: 'Access denied',
        error: 'You can only view menu from your assigned restaurant'
      });
    }
    
    const menuItems = await MenuItem.findAll({
      where: { 
        restaurantId: parseInt(restaurantId),
        isAvailable: true // Only show available items
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
