import express from "express";
import QRCode from "qrcode";
import { authenticateRestaurant } from "../middleware/auth.js";
import { enforceTenantIsolation, requirePermission } from "../middleware/rbac.js";
import Table from "../models/Table.js";
import Restaurant from "../models/Restaurant.js";

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateRestaurant);

// Get all tables
router.get("/", enforceTenantIsolation, requirePermission('read:tables'), async (req, res) => {
  try {
    console.log(`[TABLES] GET / - restaurantId: ${req.restaurantId}, userId: ${req.userId}, email: ${req.restaurantEmail}`);
    
    const tables = await Table.findAll({
      where: { restaurantId: req.restaurantId },
      order: [['tableId', 'ASC']],
    });
    
    console.log(`[TABLES] Retrieved ${tables.length} tables for restaurant ${req.restaurantId}`);
    res.json(tables);
  } catch (error) {
    console.error(`[TABLES] Error in GET /: ${error.message}`, error.stack);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get single table by ID
router.get("/:id", enforceTenantIsolation, requirePermission('read:tables'), async (req, res) => {
  try {
    const table = await Table.findOne({ 
      where: { 
        id: req.params.id,
        restaurantId: req.restaurantId 
      } 
    });
    
    if (!table) {
      return res.status(404).json({ message: "Table not found" });
    }
    res.json(table);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get table by tableId
router.get("/by-table-id/:tableId", enforceTenantIsolation, requirePermission('read:tables'), async (req, res) => {
  try {
    const table = await Table.findOne({ 
      where: { 
        tableId: req.params.tableId,
        restaurantId: req.restaurantId 
      } 
    });
    
    if (!table) {
      return res.status(404).json({ message: "Table not found" });
    }
    res.json(table);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Create new table
router.post("/", enforceTenantIsolation, requirePermission('write:tables'), async (req, res) => {
  try {
    console.log('[TABLES] POST / - Creating table for restaurantId:', req.restaurantId);
    console.log('[TABLES] Request body:', req.body);
    
    const { tableId, tableName, seats, location } = req.body;

    // Check if table ID already exists for this restaurant
    const existingTable = await Table.findOne({ 
      where: { 
        tableId,
        restaurantId: req.restaurantId 
      } 
    });
    if (existingTable) {
      console.log('[TABLES] Table ID already exists:', tableId);
      return res.status(400).json({ message: "Table ID already exists" });
    }

    // Get restaurant slug for QR code URL
    console.log('[TABLES] Finding restaurant by ID:', req.restaurantId);
    const restaurant = await Restaurant.findByPk(req.restaurantId);
    
    if (!restaurant) {
      console.error('[TABLES] Restaurant not found for ID:', req.restaurantId);
      return res.status(404).json({ message: "Restaurant not found" });
    }
    
    console.log('[TABLES] Restaurant found:', restaurant.slug);
    const baseUrl = process.env.CUSTOMER_APP_URL || "http://localhost:8080";
    // CUSTOMER QR CODE: Direct public menu access - no authentication
    const orderUrl = `${baseUrl}/menu/${restaurant.slug}/table/${tableId}`;

    // Generate QR code as base64 image
    const qrCodeImage = await QRCode.toDataURL(orderUrl, {
      errorCorrectionLevel: "H",
      type: "image/png",
      width: 300,
      margin: 2,
    });

    const table = await Table.create({
      tableId,
      tableName,
      seats: seats || 4,
      location: location || "",
      qrCode: qrCodeImage,
      isActive: true,
      restaurantId: req.restaurantId,
    });

    console.log(`[ADMIN TABLE CREATE] ✓ Table created:`, {
      tableId: table.tableId,
      tableName: table.tableName,
      restaurantId: table.restaurantId,
      isActive: table.isActive,
      id: table.id
    });
    res.status(201).json(table);
  } catch (error) {
    console.error(`[TABLES] Error creating table:`, error.message);
    console.error('[TABLES] Stack:', error.stack);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Update table
router.put("/:id", enforceTenantIsolation, requirePermission('write:tables'), async (req, res) => {
  try {
    const { tableName, seats, location, isActive } = req.body;

    const table = await Table.findOne({ 
      where: { 
        id: req.params.id,
        restaurantId: req.restaurantId 
      } 
    });
    if (!table) {
      return res.status(404).json({ message: "Table not found" });
    }

    // Update fields
    const updateData = {};
    if (tableName) updateData.tableName = tableName;
    if (seats !== undefined) updateData.seats = seats;
    if (location !== undefined) updateData.location = location;
    if (isActive !== undefined) updateData.isActive = isActive;

    await table.update(updateData);
    res.json(table);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Regenerate QR code for a table
router.post("/:id/regenerate-qr", async (req, res) => {
  try {
    const table = await Table.findOne({ 
      where: { 
        id: req.params.id,
        restaurantId: req.restaurantId 
      } 
    });
    if (!table) {
      return res.status(404).json({ message: "Table not found" });
    }

    // Get restaurant slug for QR code URL
    const restaurant = await Restaurant.findByPk(req.restaurantId);
    const baseUrl = process.env.CUSTOMER_APP_URL || "http://localhost:8080";
    // CUSTOMER QR CODE: Direct public menu access - no authentication
    const orderUrl = `${baseUrl}/menu/${restaurant.slug}/table/${table.tableId}`;
      
    const qrCodeImage = await QRCode.toDataURL(orderUrl, {
      errorCorrectionLevel: "H",
      type: "image/png",
      width: 300,
      margin: 2,
    });

    await table.update({ qrCode: qrCodeImage });
    res.json(table);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Delete table
router.delete("/:id", enforceTenantIsolation, requirePermission('delete:all'), async (req, res) => {
  try {
    const table = await Table.findOne({ 
      where: { 
        id: req.params.id,
        restaurantId: req.restaurantId 
      } 
    });
    if (!table) {
      return res.status(404).json({ message: "Table not found" });
    }
    await table.destroy();
    res.json({ message: "Table deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;
