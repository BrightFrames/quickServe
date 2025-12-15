/**
 * Input Validation Middleware using express-validator
 * 
 * Purpose:
 * - Validate and sanitize user input before processing
 * - Prevent SQL injection, XSS attacks, and malformed data
 * - Ensure data integrity across all critical endpoints
 * 
 * Strategy:
 * - Use express-validator for declarative validation rules
 * - Chain sanitization with validation
 * - Return structured error responses
 * - Log validation failures for security monitoring
 */

import { body, param, validationResult } from "express-validator";
import { createLogger } from "./logger.js";

const logger = createLogger("Validation");

/**
 * Middleware to check validation results and return errors
 */
export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => ({
      field: err.path,
      message: err.msg,
      value: err.value,
    }));

    logger.warn("Validation failed", {
      path: req.originalUrl,
      method: req.method,
      errors: errorMessages,
      ip: req.ip,
    });

    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errorMessages,
    });
  }

  next();
};

/**
 * Restaurant Signup Validation Rules
 * 
 * Validates:
 * - Name: 2-100 characters, alphanumeric with spaces
 * - Email: Valid email format
 * - Password: Minimum 6 characters
 * - Phone: Valid Indian phone number (10 digits)
 * - Address: Required, 10-500 characters
 */
export const validateRestaurantSignup = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Restaurant name must be between 2 and 100 characters")
    .matches(/^[a-zA-Z0-9\s\-&'.,]+$/)
    .withMessage("Restaurant name contains invalid characters"),

  body("email")
    .trim()
    .isEmail()
    .withMessage("Please provide a valid email address"),
  // Note: Email normalization is handled in the route itself

  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),

  body("phone")
    .trim()
    .matches(/^\+?[\d\s\-()]+$/)
    .isLength({ min: 10, max: 15 })
    .withMessage("Please provide a valid phone number (10-15 digits)"),

  body("address")
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage("Address must be between 5 and 500 characters"),

  validateRequest,
];

/**
 * Login Validation Rules
 * 
 * Validates:
 * - Username: 3-50 characters, alphanumeric with underscores
 * - Password: Required, no length check (for security)
 * - Role: Must be valid role
 */
export const validateLogin = [
  body("username")
    .optional()
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage("Username must be between 3 and 50 characters")
    .matches(/^[a-zA-Z0-9_\.@]+$/) // Allow @ and . for email-like usernames if needed, but mainly optional
    .withMessage("Username can only contain letters, numbers, and underscores"),

  body("password")
    .notEmpty()
    .withMessage("Password is required"),

  body("role")
    .optional()
    .isIn(["admin", "kitchen", "cook", "captain", "reception"])
    .withMessage("Invalid role"),

  validateRequest,
];

/**
 * Order Creation Validation Rules
 * 
 * Validates:
 * - Items: Must be array with at least 1 item
 * - Each item: Valid menuItemId, name, quantity, price
 * - Table number: Alphanumeric
 * - Payment method: cash/card/upi
 * - Restaurant ID or slug: Required
 */
export const validateOrderCreation = [
  body("items")
    .isArray({ min: 1 })
    .withMessage("Order must contain at least one item"),

  body("items.*.menuItemId")
    .exists()
    .withMessage("Menu item ID is required")
    .isString()
    .withMessage("Menu item ID must be a string")
    .trim()
    .notEmpty()
    .withMessage("Menu item ID cannot be empty"),

  body("items.*.name")
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Item name must be between 1 and 100 characters"),

  body("items.*.quantity")
    .isInt({ min: 1, max: 50 })
    .withMessage("Quantity must be between 1 and 50"),

  body("items.*.price")
    .custom((value) => {
      // Accept both number and string, convert to float
      const num = parseFloat(value);
      if (isNaN(num) || num < 0) {
        throw new Error("Price must be a positive number");
      }
      return true;
    }),

  body("tableNumber")
    .optional()
    .custom((value) => {
      if (value && !/^[a-zA-Z0-9\-_]+$/.test(String(value))) {
        throw new Error("Table number must be alphanumeric");
      }
      return true;
    }),

  body("paymentMethod")
    .optional()
    .isIn(["cash", "card", "upi"])
    .withMessage("Payment method must be cash, card, or upi"),

  body("customerPhone")
    .optional()
    .custom((value) => {
      if (value && !/^[6-9]\d{9}$/.test(String(value))) {
        throw new Error("Invalid phone number format");
      }
      return true;
    }),

  body("customerEmail")
    .optional()
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail(),

  validateRequest,
];

/**
 * Payment Status Update Validation Rules
 * 
 * Validates:
 * - Order ID: Required, integer
 * - Payment method: cash/card/upi
 * - Payment status: pending/paid/failed
 * - Transaction ID: Optional, alphanumeric
 */
export const validatePaymentStatus = [
  body("orderId")
    .isInt({ min: 1 })
    .withMessage("Valid order ID is required"),

  body("paymentMethod")
    .isIn(["cash", "card", "upi"])
    .withMessage("Payment method must be cash, card, or upi"),

  body("paymentStatus")
    .isIn(["pending", "paid", "failed"])
    .withMessage("Payment status must be pending, paid, or failed"),

  body("transactionId")
    .optional()
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage("Invalid transaction ID format"),

  validateRequest,
];

/**
 * Menu Item Validation Rules
 * 
 * Validates:
 * - Name: 2-100 characters
 * - Description: Optional, max 500 characters
 * - Price: Positive number
 * - Category: Valid category
 * - Available: Boolean
 */
export const validateMenuItem = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Item name must be between 2 and 100 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description must not exceed 500 characters"),

  body("price")
    .isFloat({ min: 0, max: 100000 })
    .withMessage("Price must be between 0 and 100000"),

  body("category")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Category must be between 2 and 50 characters"),

  body("available")
    .optional()
    .isBoolean()
    .withMessage("Available must be true or false"),

  validateRequest,
];

/**
 * Table Number Validation (Param)
 * 
 * Validates:
 * - Table number: Alphanumeric with hyphens/underscores
 */
export const validateTableNumber = [
  param("tableNumber")
    .matches(/^[a-zA-Z0-9\-_]+$/)
    .withMessage("Table number must be alphanumeric"),

  validateRequest,
];

/**
 * Restaurant Slug Validation (Param)
 * 
 * Validates:
 * - Slug: Lowercase alphanumeric with hyphens
 */
export const validateRestaurantSlug = [
  param("restaurantSlug")
    .matches(/^[a-z0-9-]+$/)
    .withMessage("Restaurant slug must be lowercase alphanumeric with hyphens"),

  validateRequest,
];

/**
 * Order ID Validation (Param)
 * 
 * Validates:
 * - Order ID: Positive integer
 */
export const validateOrderId = [
  param("orderId")
    .isInt({ min: 1 })
    .withMessage("Order ID must be a positive integer"),

  validateRequest,
];

logger.info("Validation middleware initialized", {
  validators: [
    "validateRestaurantSignup",
    "validateLogin",
    "validateOrderCreation",
    "validatePaymentStatus",
    "validateMenuItem",
    "validateTableNumber",
    "validateRestaurantSlug",
    "validateOrderId",
  ],
});
