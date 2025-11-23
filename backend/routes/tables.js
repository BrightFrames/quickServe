import express from "express";
import QRCode from "qrcode";
import Table from "../models/Table.js";

const router = express.Router();

// Get all tables
router.get("/", async (req, res) => {
  try {
    const tables = await Table.find().sort({ tableId: 1 });
    res.json(tables);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get single table by ID
router.get("/:id", async (req, res) => {
  try {
    const table = await Table.findById(req.params.id);
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
    const table = await Table.findOne({ tableId: req.params.tableId });
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
    const { tableId, tableName, seats, location } = req.body;

    // Check if table ID already exists
    const existingTable = await Table.findOne({ tableId });
    if (existingTable) {
      return res.status(400).json({ message: "Table ID already exists" });
    }

    // Generate QR code URL - points to customer app with table parameter
    const orderUrl = `${
      process.env.CUSTOMER_APP_URL || "http://localhost:8080"
    }?table=${tableId}`;

    // Generate QR code as base64 image
    const qrCodeImage = await QRCode.toDataURL(orderUrl, {
      errorCorrectionLevel: "H",
      type: "image/png",
      width: 300,
      margin: 2,
    });

    const table = new Table({
      tableId,
      tableName,
      seats: seats || 4,
      location: location || "",
      qrCode: qrCodeImage,
      isActive: true,
    });

    await table.save();
    res.status(201).json(table);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Update table
router.put("/:id", async (req, res) => {
  try {
    const { tableName, seats, location, isActive } = req.body;

    const table = await Table.findById(req.params.id);
    if (!table) {
      return res.status(404).json({ message: "Table not found" });
    }

    // Update fields
    if (tableName) table.tableName = tableName;
    if (seats !== undefined) table.seats = seats;
    if (location !== undefined) table.location = location;
    if (isActive !== undefined) table.isActive = isActive;

    await table.save();
    res.json(table);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Regenerate QR code for a table
router.post("/:id/regenerate-qr", async (req, res) => {
  try {
    const table = await Table.findById(req.params.id);
    if (!table) {
      return res.status(404).json({ message: "Table not found" });
    }

    // Generate new QR code
    const orderUrl = `${
      process.env.CUSTOMER_APP_URL || "http://localhost:8080"
    }?table=${table.tableId}`;
    const qrCodeImage = await QRCode.toDataURL(orderUrl, {
      errorCorrectionLevel: "H",
      type: "image/png",
      width: 300,
      margin: 2,
    });

    table.qrCode = qrCodeImage;
    await table.save();

    res.json(table);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Delete table
router.delete("/:id", async (req, res) => {
  try {
    const table = await Table.findByIdAndDelete(req.params.id);
    if (!table) {
      return res.status(404).json({ message: "Table not found" });
    }
    res.json({ message: "Table deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;
