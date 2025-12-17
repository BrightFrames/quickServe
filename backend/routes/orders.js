
import express from "express";
import orderController from "../controllers/orderController.js";
import { authenticateRestaurant } from "../middleware/auth.js";
import { enforceTenantIsolation, requirePermission } from "../middleware/rbac.js";
import { sanitizeCustomerInput, rateLimitCustomer } from "../middleware/customerSecurity.js";
import { orderRateLimiter } from "../utils/rateLimiter.js";
import { validateOrderCreation } from "../utils/validators.js";

const router = express.Router();

// Get active orders (authenticated)
router.get("/active", authenticateRestaurant, enforceTenantIsolation, requirePermission('read:orders'), (req, res) => orderController.getActiveOrders(req, res)); // Using arrow function to preserve 'this' in class method if not bound, or just class instance

// Get all orders (authenticated)
router.get("/", authenticateRestaurant, enforceTenantIsolation, requirePermission('read:orders'), (req, res) => orderController.getAllOrders(req, res));

// Get orders by table (authenticated)
router.get("/by-table/:tableId", authenticateRestaurant, enforceTenantIsolation, requirePermission('read:orders'), (req, res) => orderController.getOrdersByTable(req, res));

// Create order (Public)
router.post("/",
  orderRateLimiter,
  rateLimitCustomer,
  sanitizeCustomerInput,
  validateOrderCreation,
  (req, res) => orderController.createOrder(req, res)
);

// Get Single Order (Public)
router.get("/:id", (req, res) => orderController.getSingleOrder(req, res));

// Update Order Status (Authenticated)
router.put("/:id/status", authenticateRestaurant, enforceTenantIsolation, requirePermission('update:order_status'), (req, res) => orderController.updateStatus(req, res));

// Download HTML Invoice (Authenticated)
router.get("/:id/invoice/download", authenticateRestaurant, enforceTenantIsolation, requirePermission('read:orders'), (req, res) => orderController.downloadInvoice(req, res));

// Download PDF Invoice (Public)
router.get("/:id/invoice/pdf", (req, res) => orderController.downloadPDFInvoice(req, res));

export default router;
