import express from "express";
import QRCode from "qrcode";
import Table from "../models/Table.js";

const router = express.Router();

// Get all tables
router.get("/", async (req, res) => {
  try {
    const tables = await Table.findAll({
      order: [['tableId', 'ASC']],
    });
    res.json(tables);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get single table by ID
router.get("/:id", async (req, res) => {
  try {
    const table = await Table.findByPk(req.params.id);
    if (!table) {
      return res.status(404).json({ message: "Table not found" });
    }
    res.json(table);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get table by tableId
router.get("/by-table-id/:tableId", async (req, res) => {
  try {
    const table = await Table.findOne({ where: { tableId: req.params.tableId } });
    if (!table) {
      return res.status(404).json({ message: "Table not found" });
    }
    res.json(table);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Create new table
router.post("/", async (req, res) => {
  try {
    const { tableId, tableName, seats, location, restaurantSlug } = req.body;

    // Check if table ID already exists
    const existingTable = await Table.findOne({ where: { tableId } });
    if (existingTable) {
      return res.status(400).json({ message: "Table ID already exists" });
    }

    // Generate QR code URL - use environment variable or default to localhost
    // The URL should point to the customer frontend with restaurant slug and table
    const baseUrl = process.env.CUSTOMER_APP_URL || "http://localhost:8080";
    const orderUrl = restaurantSlug 
      ? `${baseUrl}/${restaurantSlug}?table=${tableId}`
      : `${baseUrl}?table=${tableId}`;

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
    });

    res.status(201).json(table);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Update table
router.put("/:id", async (req, res) => {
  try {
    const { tableName, seats, location, isActive } = req.body;

    const table = await Table.findByPk(req.params.id);
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
    const { restaurantSlug } = req.body;
    
    const table = await Table.findByPk(req.params.id);
    if (!table) {
      return res.status(404).json({ message: "Table not found" });
    }

    // Generate new QR code with proper URL structure
    const baseUrl = process.env.CUSTOMER_APP_URL || "http://localhost:8080";
    const orderUrl = restaurantSlug 
      ? `${baseUrl}/${restaurantSlug}?table=${table.tableId}`
      : `${baseUrl}?table=${table.tableId}`;
      
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
router.delete("/:id", async (req, res) => {
  try {
    const table = await Table.findByPk(req.params.id);
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
