import express from "express";
import QRCode from "qrcode";
import { tenantMiddleware, requireTenant } from "../middleware/tenantMiddleware.js";

const router = express.Router();

// Apply tenant middleware to all routes
router.use(tenantMiddleware);

// Get all tables
router.get("/", requireTenant, async (req, res) => {
  try {
    const { Table: TenantTable } = req.tenant.models;
    
    const tables = await TenantTable.findAll({
      order: [['tableId', 'ASC']],
    });
    
    console.log(`[TABLES] Retrieved ${tables.length} tables for ${req.tenant.slug}`);
    res.json(tables);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get single table by ID
router.get("/:id", requireTenant, async (req, res) => {
  try {
    const { Table: TenantTable } = req.tenant.models;
    const table = await TenantTable.findByPk(req.params.id);
    
    if (!table) {
      return res.status(404).json({ message: "Table not found" });
    }
    res.json(table);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get table by tableId
router.get("/by-table-id/:tableId", requireTenant, async (req, res) => {
  try {
    const { Table: TenantTable } = req.tenant.models;
    const table = await TenantTable.findOne({ where: { tableId: req.params.tableId } });
    
    if (!table) {
      return res.status(404).json({ message: "Table not found" });
    }
    res.json(table);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Create new table
router.post("/", requireTenant, async (req, res) => {
  try {
    const { Table: TenantTable } = req.tenant.models;
    const { tableId, tableName, seats, location } = req.body;

    // Check if table ID already exists
    const existingTable = await TenantTable.findOne({ where: { tableId } });
    if (existingTable) {
      return res.status(400).json({ message: "Table ID already exists" });
    }

    // Generate QR code URL - use restaurant slug from tenant context
    const baseUrl = process.env.CUSTOMER_APP_URL || "http://localhost:8080";
    const orderUrl = `${baseUrl}/${req.tenant.slug}?table=${tableId}`;

    // Generate QR code as base64 image
    const qrCodeImage = await QRCode.toDataURL(orderUrl, {
      errorCorrectionLevel: "H",
      type: "image/png",
      width: 300,
      margin: 2,
    });

    const table = await TenantTable.create({
      tableId,
      tableName,
      seats: seats || 4,
      location: location || "",
      qrCode: qrCodeImage,
      isActive: true,
    });

    console.log(`[TABLES] ✓ Table created for ${req.tenant.slug}: ${tableId}`);
    res.status(201).json(table);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Update table
router.put("/:id", requireTenant, async (req, res) => {
  try {
    const { Table: TenantTable } = req.tenant.models;
    const { tableName, seats, location, isActive } = req.body;

    const table = await TenantTable.findByPk(req.params.id);
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
router.post("/:id/regenerate-qr", requireTenant, async (req, res) => {
  try {
    const { Table: TenantTable } = req.tenant.models;
    
    const table = await TenantTable.findByPk(req.params.id);
    if (!table) {
      return res.status(404).json({ message: "Table not found" });
    }

    // Generate new QR code with restaurant slug from tenant context
    const baseUrl = process.env.CUSTOMER_APP_URL || "http://localhost:8080";
    const orderUrl = `${baseUrl}/${req.tenant.slug}?table=${table.tableId}`;
      
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
router.delete("/:id", requireTenant, async (req, res) => {
  try {
    const { Table: TenantTable } = req.tenant.models;
    
    const table = await TenantTable.findByPk(req.params.id);
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
