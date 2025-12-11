import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Restaurant from "../models/Restaurant.js";
import User from "../models/User.js";
import { signupRateLimiter } from "../utils/rateLimiter.js";
import { validateRestaurantSignup } from "../utils/validators.js";
import { cache, cacheKeys } from "../utils/cache.js";

const router = express.Router();

// Helper function to normalize email addresses consistently
const normalizeEmail = (email) => {
  if (!email) return email;
  let normalized = email.toLowerCase().trim();
  // Remove dots from Gmail addresses (Gmail ignores dots)
  if (normalized.endsWith('@gmail.com')) {
    const [localPart, domain] = normalized.split('@');
    normalized = localPart.replace(/\./g, '') + '@' + domain;
  }
  return normalized;
};

// Helper function to retry database operations
const retryDatabaseOperation = async (operation, maxRetries = 3, delay = 1000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      const isConnectionError = 
        error.name === 'SequelizeDatabaseError' || 
        error.message?.includes('Connection terminated') ||
        error.message?.includes('connect ECONNREFUSED') ||
        error.message?.includes('connect ETIMEDOUT');
      
      if (isConnectionError && attempt < maxRetries) {
        console.log(`[DB RETRY] Attempt ${attempt} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
};

// ============================
// Restaurant Signup Route
// ============================
router.post("/signup", signupRateLimiter, validateRestaurantSignup, async (req, res) => {
  console.log("[RESTAURANT AUTH] Signup request received");
  console.log("[RESTAURANT AUTH] Body:", req.body);

  try {
    const { name, email, password, phone, address } = req.body;

    // Validate required fields
    if (!name || !email || !password || !phone || !address) {
      console.log("[RESTAURANT AUTH] Missing required fields");
      return res.status(400).json({ 
        message: "All fields are required: name, email, password, phone, address" 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log("[RESTAURANT AUTH] Invalid email format");
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Validate password length
    if (password.length < 6) {
      console.log("[RESTAURANT AUTH] Password too short");
      return res.status(400).json({ 
        message: "Password must be at least 6 characters long" 
      });
    }

    // Check if restaurant already exists (with retry)
    const normalizedEmail = normalizeEmail(email);
    const existingRestaurant = await retryDatabaseOperation(async () => {
      return await Restaurant.findOne({ where: { email: normalizedEmail } });
    });
    
    if (existingRestaurant) {
      console.log("[RESTAURANT AUTH] Email already registered");
      return res.status(400).json({ 
        message: "A restaurant with this email already exists" 
      });
    }

    console.log(`[RESTAURANT AUTH] Creating new restaurant: ${name}`);

    // Generate unique slug from restaurant name
    let slug = name.toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-'); // Replace multiple hyphens with single hyphen
    
    // Check if slug already exists and make it unique (with retry)
    let uniqueSlug = slug;
    let counter = 1;
    let slugExists = await retryDatabaseOperation(async () => {
      return await Restaurant.findOne({ where: { slug: uniqueSlug } });
    });
    
    while (slugExists) {
      uniqueSlug = `${slug}-${counter}`;
      counter++;
      slugExists = await retryDatabaseOperation(async () => {
        return await Restaurant.findOne({ where: { slug: uniqueSlug } });
      });
    }

    // Generate unique restaurant code (QS + 4 digits) with retry
    let restaurantCode;
    let isCodeUnique = false;
    while (!isCodeUnique) {
      // Generate random 4-digit number (1000-9999)
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      restaurantCode = `QS${randomNum}`;
      
      // Check if code already exists (with retry)
      const existingCode = await retryDatabaseOperation(async () => {
        return await Restaurant.findOne({ where: { restaurantCode } });
      });
      
      if (!existingCode) {
        isCodeUnique = true;
      }
    }

    console.log(`[RESTAURANT AUTH] Generated unique code: ${restaurantCode}`);

    // Create new restaurant (password will be hashed by Sequelize hook) with retry
    const restaurant = await retryDatabaseOperation(async () => {
      return await Restaurant.create({
        name: name.trim(),
        slug: uniqueSlug,
        restaurantCode: restaurantCode,
        email: normalizedEmail,
        password: password,
        phone: phone.trim(),
        address: address.trim(),
      });
    });

    console.log("[RESTAURANT AUTH] ✓ Restaurant created successfully");

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: restaurant.id, 
        email: restaurant.email, 
        type: 'restaurant' 
      },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    // Return restaurant data (excluding password)
    const restaurantData = {
      id: restaurant.id,
      name: restaurant.name,
      slug: restaurant.slug,
      restaurantCode: restaurant.restaurantCode,
      email: restaurant.email,
      phone: restaurant.phone,
      address: restaurant.address,
      requiresStaffSetup: true, // Flag to prompt for kitchen and captain passwords
    };

    res.status(201).json({
      message: "Restaurant registered successfully. Please set up kitchen and captain access.",
      restaurant: restaurantData,
      token,
    });

  } catch (error) {
    console.error("[RESTAURANT AUTH] Signup error:", error);
    
    // Handle specific database connection errors
    if (error.name === 'SequelizeDatabaseError' || 
        error.message.includes('Connection terminated') ||
        error.message.includes('connect ECONNREFUSED') ||
        error.message.includes('connect ETIMEDOUT')) {
      console.error("[RESTAURANT AUTH] Database connection error detected");
      return res.status(503).json({ 
        message: "Database connection error. Please try again in a moment.", 
        error: "Database temporarily unavailable"
      });
    }
    
    // Handle duplicate email error
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ 
        message: "A restaurant with this email already exists" 
      });
    }
    
    res.status(500).json({ 
      message: "Server error during registration", 
      error: error.message 
    });
  }
});

// ============================
// Restaurant Login Route
// ============================
router.post("/login", async (req, res) => {
  console.log("[RESTAURANT AUTH] Login request received");
  console.log("[RESTAURANT AUTH] Body:", req.body);

  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      console.log("[RESTAURANT AUTH] Missing email or password");
      return res.status(400).json({ 
        message: "Email and password are required" 
      });
    }

    console.log(`[RESTAURANT AUTH] Attempting login for: ${email}`);

    // Normalize email for consistent lookup
    const normalizedEmail = normalizeEmail(email);
    console.log(`[RESTAURANT AUTH] Normalized email: ${normalizedEmail}`);

    // Find restaurant by email
    const restaurant = await Restaurant.findOne({ 
      where: {
        email: normalizedEmail,
        isActive: true 
      }
    });

    if (!restaurant) {
      console.log("[RESTAURANT AUTH] ✗ Restaurant not found");
      return res.status(401).json({ 
        message: "Invalid email or password" 
      });
    }

    // Verify password using the model's comparePassword method
    const isValidPassword = await restaurant.comparePassword(password);
    if (!isValidPassword) {
      console.log("[RESTAURANT AUTH] ✗ Invalid password");
      return res.status(401).json({ 
        message: "Invalid email or password" 
      });
    }

    console.log("[RESTAURANT AUTH] ✓ Login successful");

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: restaurant.id, 
        email: restaurant.email, 
        type: 'restaurant' 
      },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    // Return restaurant data (excluding password)
    const restaurantData = {
      id: restaurant.id,
      name: restaurant.name,
      slug: restaurant.slug,
      restaurantCode: restaurant.restaurantCode,
      email: restaurant.email,
      phone: restaurant.phone,
      address: restaurant.address,
    };

    res.json({
      message: "Login successful",
      restaurant: restaurantData,
      token,
    });

  } catch (error) {
    console.error("[RESTAURANT AUTH] Login error:", error);
    res.status(500).json({ 
      message: "Server error during login", 
      error: error.message 
    });
  }
});

// ============================
// Verify Admin Password - For Customer Trying to Access Admin Area
// ============================
router.post("/verify-admin-password", async (req, res) => {
  console.log("[ADMIN ACCESS GUARD] Password verification request");
  
  try {
    const { slug, password } = req.body;

    if (!slug || !password) {
      return res.status(400).json({ 
        success: false,
        message: "Restaurant slug and password are required" 
      });
    }

    // Find restaurant by slug
    const restaurant = await Restaurant.findOne({ 
      where: { 
        slug: slug.toLowerCase().trim(),
        isActive: true 
      }
    });

    if (!restaurant) {
      console.log("[ADMIN ACCESS GUARD] Restaurant not found");
      return res.status(404).json({ 
        success: false,
        message: "Restaurant not found" 
      });
    }

    // Verify admin password from environment
    const isValidPassword = password === process.env.ADMIN_PASSWORD;
    
    if (!isValidPassword) {
      console.log("[ADMIN ACCESS GUARD] Invalid password");
      return res.status(401).json({ 
        success: false,
        message: "Incorrect password" 
      });
    }

    console.log("[ADMIN ACCESS GUARD] Password verified successfully");
    
    res.json({
      success: true,
      message: "Password verified successfully"
    });

  } catch (error) {
    console.error("[ADMIN ACCESS GUARD] Verification error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error during verification" 
    });
  }
});

// ============================
// Verify Admin Access (code-only verification for admin panel)
// ============================
router.post("/verify-admin", async (req, res) => {
  try {
    const { code } = req.body;

    console.log("[ADMIN VERIFY] Verifying with code:", code);

    if (!code) {
      return res.status(400).json({ 
        verified: false,
        message: "Restaurant code is required" 
      });
    }

    // Find restaurant by code
    const restaurant = await Restaurant.findOne({ 
      where: { 
        restaurantCode: code.toUpperCase().trim(),
        isActive: true 
      }
    });

    if (!restaurant) {
      console.log("[ADMIN VERIFY] Restaurant not found");
      return res.status(404).json({ 
        verified: false,
        message: "Restaurant not found with this code" 
      });
    }

    console.log("[ADMIN VERIFY] Restaurant found:", restaurant.name);
    
    res.json({
      verified: true,
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug,
        restaurantCode: restaurant.restaurantCode,
        email: restaurant.email
      }
    });

  } catch (error) {
    console.error("[ADMIN VERIFY] Verification error:", error);
    res.status(500).json({ 
      verified: false,
      message: "Server error during verification" 
    });
  }
});

// ============================
// Get Restaurant Info by Code (for admin view)
// ============================
router.get("/info/code/:restaurantCode", async (req, res) => {
  try {
    const { restaurantCode } = req.params;
    
    const restaurant = await Restaurant.findOne({
      where: { restaurantCode }
    });
    
    if (!restaurant || !restaurant.isActive) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    res.json({
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug,
        restaurantCode: restaurant.restaurantCode,
        email: restaurant.email,
        phone: restaurant.phone,
        address: restaurant.address,
        gstNumber: restaurant.gstNumber,
        taxPercentage: parseFloat(restaurant.taxPercentage) || 5.0,
        subscription: restaurant.subscription,
        paymentAccounts: restaurant.paymentAccounts,
      },
    });

  } catch (error) {
    console.error("[RESTAURANT] Info fetch error:", error);
    res.status(500).json({ message: "Failed to fetch restaurant information" });
  }
});

// ============================
// Update Payment Accounts
// ============================
router.put("/payment-accounts/:restaurantCode", async (req, res) => {
  console.log("[RESTAURANT] Update payment accounts request");
  
  try {
    const { restaurantCode } = req.params;
    const { paymentAccounts } = req.body;

    if (!paymentAccounts) {
      return res.status(400).json({ 
        message: "Payment accounts data is required" 
      });
    }

    // Find restaurant by code
    const restaurant = await Restaurant.findOne({ 
      where: { restaurantCode } 
    });

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    // Update payment accounts
    restaurant.set('paymentAccounts', paymentAccounts);
    restaurant.changed('paymentAccounts', true);
    await restaurant.save();

    console.log(`[RESTAURANT] ✓ Payment accounts updated for restaurant: ${restaurantCode}`);

    res.json({ 
      message: "Payment accounts updated successfully",
      paymentAccounts: restaurant.paymentAccounts
    });

  } catch (error) {
    console.error("[RESTAURANT] Update payment accounts error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ============================
// Restaurant Profile Route
// ============================
router.get("/profile", async (req, res) => {
  try {
    // Extract token from Authorization header
    const token = req.headers.authorization?.split(" ")[1];
    
    if (!token) {
      return res.status(401).json({ message: "Access token required" });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.type !== 'restaurant') {
      return res.status(403).json({ message: "Invalid token type" });
    }

    // Find restaurant
    const restaurant = await Restaurant.findByPk(decoded.id);
    
    if (!restaurant || !restaurant.isActive) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    res.json({
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug,
        restaurantCode: restaurant.restaurantCode,
        email: restaurant.email,
        phone: restaurant.phone,
        address: restaurant.address,
        gstNumber: restaurant.gstNumber,
        settings: restaurant.settings,
        subscription: restaurant.subscription,
        createdAt: restaurant.createdAt,
      },
    });

  } catch (error) {
    console.error("[RESTAURANT AUTH] Profile error:", error);
    res.status(401).json({ message: "Invalid token" });
  }
});

// ============================
// Update Restaurant Profile
// ============================
router.put("/profile", async (req, res) => {
  try {
    // Extract token from Authorization header
    const token = req.headers.authorization?.split(" ")[1];
    
    if (!token) {
      return res.status(401).json({ message: "Access token required" });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.type !== 'restaurant') {
      return res.status(403).json({ message: "Invalid token type" });
    }

    // Find restaurant
    const restaurant = await Restaurant.findByPk(decoded.id);
    
    if (!restaurant || !restaurant.isActive) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    // Update allowed fields
    const { phone, address, gstNumber, taxPercentage } = req.body;
    
    if (phone) restaurant.phone = phone;
    if (address) restaurant.address = address;
    if (gstNumber !== undefined) {
      // Validate GST format if provided
      if (gstNumber && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i.test(gstNumber)) {
        return res.status(400).json({ message: "Invalid GST number format" });
      }
      restaurant.gstNumber = gstNumber ? gstNumber.toUpperCase() : null;
    }
    if (taxPercentage !== undefined) {
      // Validate tax percentage range
      const tax = parseFloat(taxPercentage);
      if (isNaN(tax) || tax < 0 || tax > 100) {
        return res.status(400).json({ message: "Tax percentage must be between 0 and 100" });
      }
      restaurant.taxPercentage = tax;
    }

    await restaurant.save();

    res.json({
      message: "Profile updated successfully",
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug,
        restaurantCode: restaurant.restaurantCode,
        email: restaurant.email,
        phone: restaurant.phone,
        address: restaurant.address,
        gstNumber: restaurant.gstNumber,
        taxPercentage: restaurant.taxPercentage,
      },
    });

  } catch (error) {
    console.error("[RESTAURANT AUTH] Profile update error:", error);
    res.status(500).json({ message: "Failed to update profile" });
  }
});

// ============================
// Restaurant Logout Route
// ============================
router.post("/logout", async (req, res) => {
  try {
    // For now, logout is handled client-side by removing the token
    // In a production environment, you might want to implement token blacklisting
    console.log("[RESTAURANT AUTH] Logout request");
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("[RESTAURANT AUTH] Logout error:", error);
    res.status(500).json({ message: "Server error during logout" });
  }
});

// ============================
// Verify Restaurant by Slug and Code
// Route: GET /api/restaurant/verify/:slug/:code
// Example: /api/restaurant/verify/sourabh-upadhyay/QS2453
// ============================
router.get("/verify/:slug/:code", async (req, res) => {
  try {
    const { slug, code } = req.params;
    
    console.log(`[RESTAURANT AUTH] Verification request for slug: ${slug}, code: ${code}`);

    // Find restaurant by slug and code
    const restaurant = await Restaurant.findOne({
      where: {
        slug: slug.toLowerCase(),
        restaurantCode: code.toUpperCase(),
        isActive: true
      }
    });

    if (!restaurant) {
      console.log("[RESTAURANT AUTH] ✗ Restaurant not found or code mismatch");
      return res.status(404).json({ 
        verified: false,
        message: "Restaurant not found or invalid code" 
      });
    }

    console.log("[RESTAURANT AUTH] ✓ Restaurant verified successfully");

    res.json({
      verified: true,
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug,
        restaurantCode: restaurant.restaurantCode,
        email: restaurant.email,
        phone: restaurant.phone,
        address: restaurant.address,
      }
    });

  } catch (error) {
    console.error("[RESTAURANT AUTH] Verification error:", error);
    res.status(500).json({ 
      verified: false,
      message: "Server error during verification" 
    });
  }
});

// ============================
// Update Dashboard Password
// ============================
/**
 * PATCH /api/restaurant/dashboard-password
 * 
 * Updates the per-restaurant dashboard password.
 * Requires authentication and validates old password before updating.
 * 
 * Request Body:
 * {
 *   "oldPassword": "admin123",
 *   "newPassword": "newSecurePassword123"
 * }
 */
router.patch("/dashboard-password", async (req, res) => {
  console.log("[RESTAURANT] Dashboard password update request");
  
  try {
    // Extract restaurant info from JWT token
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      console.log("[RESTAURANT] ✗ No authentication token provided");
      return res.status(401).json({ message: "Authentication required" });
    }

    // Verify and decode token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      console.log("[RESTAURANT] ✗ Invalid token");
      return res.status(401).json({ message: "Invalid authentication token" });
    }

    const { oldPassword, newPassword } = req.body;

    // Validate input
    if (!oldPassword || !newPassword) {
      console.log("[RESTAURANT] ✗ Missing required fields");
      return res.status(400).json({ 
        message: "Old password and new password are required" 
      });
    }

    // Validate new password length
    if (newPassword.length < 6) {
      console.log("[RESTAURANT] ✗ New password too short");
      return res.status(400).json({ 
        message: "New password must be at least 6 characters long" 
      });
    }

    // Prevent using default password
    if (newPassword === 'admin123') {
      console.log("[RESTAURANT] ✗ Cannot set default password");
      return res.status(400).json({ 
        message: "Cannot use 'admin123' as password. Please choose a different password." 
      });
    }

    // Get restaurant from token
    const restaurantId = decoded.id || decoded.restaurantId;
    if (!restaurantId) {
      console.log("[RESTAURANT] ✗ Restaurant ID not found in token");
      return res.status(401).json({ message: "Invalid token structure" });
    }

    const restaurant = await Restaurant.findByPk(restaurantId);
    if (!restaurant) {
      console.log("[RESTAURANT] ✗ Restaurant not found");
      return res.status(404).json({ message: "Restaurant not found" });
    }

    // Validate old password
    const isOldPasswordValid = await restaurant.compareDashboardPassword(oldPassword);
    if (!isOldPasswordValid) {
      console.log("[RESTAURANT] ✗ Old password incorrect");
      return res.status(401).json({ 
        message: "Current dashboard password is incorrect" 
      });
    }

    // Update dashboard password (Sequelize hook will hash it)
    restaurant.dashboardPassword = newPassword;
    await restaurant.save();

    console.log(`[RESTAURANT] ✓ Dashboard password updated for restaurant ${restaurant.name}`);

    res.json({
      message: "Dashboard password updated successfully",
      isUsingDefault: false
    });

  } catch (error) {
    console.error("[RESTAURANT] Dashboard password update error:", error);
    res.status(500).json({ 
      message: "Server error updating dashboard password", 
      error: error.message 
    });
  }
});

// ============================
// Check Dashboard Password Status
// ============================
/**
 * GET /api/restaurant/dashboard-password-status
 * 
 * Checks if restaurant is using the default dashboard password.
 * Requires authentication.
 * 
 * Response:
 * {
 *   "isUsingDefault": true/false
 * }
 */
router.get("/dashboard-password-status", async (req, res) => {
  console.log("[RESTAURANT] Dashboard password status check");
  
  try {
    // Extract restaurant info from JWT token
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Verify and decode token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: "Invalid authentication token" });
    }

    const restaurantId = decoded.id || decoded.restaurantId;
    if (!restaurantId) {
      return res.status(401).json({ message: "Invalid token structure" });
    }

    const restaurant = await Restaurant.findByPk(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    const isUsingDefault = await restaurant.isUsingDefaultDashboardPassword();

    res.json({
      isUsingDefault,
      message: isUsingDefault 
        ? "Using default dashboard password. Please update for security." 
        : "Using custom dashboard password."
    });

  } catch (error) {
    console.error("[RESTAURANT] Dashboard password status error:", error);
    res.status(500).json({ 
      message: "Server error checking dashboard password status", 
      error: error.message 
    });
  }
});

// ============================
// Update Admin/Kitchen Passwords Route
// ============================
router.put("/update-credentials/:restaurantCode", async (req, res) => {
  console.log("[RESTAURANT AUTH] Update credentials request");
  
  try {
    const { restaurantCode } = req.params;
    const { type, username, password } = req.body; // type can be 'admin' or 'kitchen'

    if (!type) {
      return res.status(400).json({ 
        message: "Type (admin/kitchen) is required" 
      });
    }

    if (!username && !password) {
      return res.status(400).json({ 
        message: "At least username or password must be provided" 
      });
    }

    if (password && password.length < 6) {
      return res.status(400).json({ 
        message: "Password must be at least 6 characters long" 
      });
    }

    if (username && username.length < 3) {
      return res.status(400).json({ 
        message: "Username must be at least 3 characters long" 
      });
    }

    // Find restaurant by code
    const restaurant = await Restaurant.findOne({ 
      where: { restaurantCode } 
    });

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    // Update settings with new credentials
    const currentSettings = restaurant.settings || {};
    const credentials = currentSettings.credentials || {};

    if (type === 'admin') {
      // Update admin credentials
      if (username) {
        credentials.adminUsername = username;
      }
      if (password) {
        const salt = await bcrypt.genSalt(10);
        credentials.adminPassword = await bcrypt.hash(password, salt);
      }
    } else if (type === 'kitchen') {
      // Update kitchen credentials
      if (username) {
        credentials.kitchenUsername = username;
      }
      if (password) {
        const salt = await bcrypt.genSalt(10);
        credentials.kitchenPassword = await bcrypt.hash(password, salt);
      }
    } else {
      return res.status(400).json({ message: "Invalid type. Use 'admin' or 'kitchen'" });
    }

    currentSettings.credentials = credentials;
    
    // Use set() to properly mark JSONB field as changed
    restaurant.set('settings', currentSettings);
    restaurant.changed('settings', true);
    await restaurant.save();

    const updates = [];
    if (username) updates.push('username');
    if (password) updates.push('password');
    
    console.log(`[RESTAURANT AUTH] ✓ ${type} ${updates.join(' and ')} updated for restaurant: ${restaurantCode}`);

    res.json({ 
      message: `${type === 'admin' ? 'Admin' : 'Kitchen'} ${updates.join(' and ')} updated successfully` 
    });

  } catch (error) {
    console.error("[RESTAURANT AUTH] Update credentials error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ============================
// Get Restaurant Info by Slug or ID (Public - for customers)
// ============================
router.get("/info/:identifier", async (req, res) => {
  try {
    const { identifier } = req.params;
    console.log(`[RESTAURANT INFO] Request for identifier: ${identifier}`);
    
    // Check cache first
    const cacheKey = cacheKeys.restaurant(identifier);
    const cachedRestaurant = cache.get(cacheKey);
    
    if (cachedRestaurant) {
      console.log(`[CACHE] Restaurant info cache HIT for ${identifier}`);
      return res.json(cachedRestaurant);
    }
    
    let restaurant = null;
    
    // Check if identifier is a numeric ID
    const numericId = parseInt(identifier, 10);
    if (!isNaN(numericId) && numericId > 0) {
      // CORE FIX: Use primary key (id) directly for fastest, most reliable lookup
      console.log(`[RESTAURANT INFO] Looking up by restaurantId: ${numericId}`);
      restaurant = await Restaurant.findByPk(numericId, {
        attributes: ['id', 'name', 'slug', 'restaurantCode', 'taxPercentage', 'address', 'phone', 'isActive']
      });
    } else {
      // Fallback: treat as slug and map to restaurantId
      console.log(`[RESTAURANT INFO] Looking up by slug: ${identifier}`);
      restaurant = await Restaurant.findOne({ 
        where: { slug: identifier.toLowerCase().trim() },
        attributes: ['id', 'name', 'slug', 'restaurantCode', 'taxPercentage', 'address', 'phone', 'isActive']
      });
    }
    
    console.log(`[RESTAURANT INFO] Found restaurant:`, restaurant ? {
      id: restaurant.id,
      name: restaurant.name,
      taxPercentage: restaurant.taxPercentage,
      isActive: restaurant.isActive
    } : 'null');
    
    if (!restaurant || !restaurant.isActive) {
      console.log(`[RESTAURANT INFO] Restaurant not found or inactive`);
      return res.status(404).json({ message: "Restaurant not found" });
    }

    const response = {
      id: restaurant.id, // Always return the primary key for frontend caching
      name: restaurant.name,
      slug: restaurant.slug,
      restaurantCode: restaurant.restaurantCode,
      taxPercentage: parseFloat(restaurant.taxPercentage) || 5.0,
      address: restaurant.address,
      phone: restaurant.phone
    };
    
    // Cache for 15 minutes
    cache.set(cacheKey, response, 15 * 60 * 1000);
    console.log(`[RESTAURANT INFO] Sending response with restaurantId: ${response.id}`);
    
    res.json(response);

  } catch (error) {
    console.error("[RESTAURANT INFO] Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ============================
// Setup Kitchen and Captain Credentials
// ============================
/**
 * POST /api/restaurant/setup-staff-access
 * 
 * Sets up kitchen and captain user accounts for a newly registered restaurant.
 * This endpoint should be called immediately after restaurant signup to create
 * staff access credentials.
 * 
 * Security Features:
 * - Each staff account is tied to a specific restaurantId
 * - Usernames are automatically generated as kitchen_{slug} and captain_{slug}
 * - Passwords are securely hashed before storage
 * - Authentication validates both username AND restaurantId
 * - Login with wrong restaurantId will fail even with correct credentials
 * 
 * Request Body:
 * {
 *   "restaurantId": number,
 *   "kitchenPassword": string (min 6 chars),
 *   "captainPassword": string (min 6 chars)
 * }
 * 
 * Response:
 * {
 *   "message": "Kitchen and captain access set up successfully",
 *   "staffAccounts": {
 *     "kitchen": { "username": "kitchen_restaurant_name", "restaurantId": 1 },
 *     "captain": { "username": "captain_restaurant_name", "restaurantId": 1 }
 *   }
 * }
 */
router.post("/setup-staff-access", async (req, res) => {
  console.log("[RESTAURANT AUTH] Staff setup request received");
  
  try {
    const { restaurantId, kitchenPassword, captainPassword } = req.body;
    
    // Validate required fields
    if (!restaurantId || !kitchenPassword || !captainPassword) {
      console.log("[RESTAURANT AUTH] Missing required fields for staff setup");
      return res.status(400).json({ 
        message: "Restaurant ID, kitchen password, and captain password are required" 
      });
    }

    // Validate password length
    if (kitchenPassword.length < 6 || captainPassword.length < 6) {
      console.log("[RESTAURANT AUTH] Passwords too short");
      return res.status(400).json({ 
        message: "Kitchen and captain passwords must be at least 6 characters long" 
      });
    }

    // Verify restaurant exists
    const restaurant = await Restaurant.findByPk(restaurantId);
    if (!restaurant) {
      console.log("[RESTAURANT AUTH] Restaurant not found");
      return res.status(404).json({ message: "Restaurant not found" });
    }

    // Generate unique usernames based on restaurant slug
    const kitchenUsername = `kitchen_${restaurant.slug.replace(/-/g, '_')}`;
    const captainUsername = `captain_${restaurant.slug.replace(/-/g, '_')}`;

    console.log(`[RESTAURANT AUTH] Creating staff accounts for restaurant ${restaurant.name}`);

    // Check if accounts already exist
    const existingKitchen = await User.findOne({ 
      where: { username: kitchenUsername, restaurantId } 
    });
    const existingCaptain = await User.findOne({ 
      where: { username: captainUsername, restaurantId } 
    });

    if (existingKitchen || existingCaptain) {
      console.log("[RESTAURANT AUTH] Staff accounts already exist");
      return res.status(400).json({ 
        message: "Kitchen or captain accounts already exist for this restaurant. Use update endpoint to change passwords." 
      });
    }

    // Create kitchen user account
    const kitchenUser = await User.create({
      username: kitchenUsername,
      password: kitchenPassword, // Will be hashed by Sequelize hook
      role: 'kitchen',
      restaurantId: restaurant.id,
      isOnline: false,
      lastActive: new Date()
    });

    console.log(`[RESTAURANT AUTH] ✓ Kitchen account created: ${kitchenUsername}`);

    // Create captain user account
    const captainUser = await User.create({
      username: captainUsername,
      password: captainPassword, // Will be hashed by Sequelize hook
      role: 'captain',
      restaurantId: restaurant.id,
      isOnline: false,
      lastActive: new Date()
    });

    console.log(`[RESTAURANT AUTH] ✓ Captain account created: ${captainUsername}`);

    res.status(201).json({
      message: "Kitchen and captain access set up successfully",
      staffAccounts: {
        kitchen: {
          username: kitchenUsername,
          restaurantId: restaurant.id
        },
        captain: {
          username: captainUsername,
          restaurantId: restaurant.id
        }
      }
    });

  } catch (error) {
    console.error("[RESTAURANT AUTH] Staff setup error:", error);
    
    // Handle unique constraint errors
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ 
        message: "Staff accounts already exist for this restaurant" 
      });
    }
    
    res.status(500).json({ 
      message: "Server error during staff setup", 
      error: error.message 
    });
  }
});

// ============================
// Check Staff Setup Status
// ============================
/**
 * GET /api/restaurant/staff-setup-status/:restaurantId
 * 
 * Checks if kitchen and captain accounts have been set up for a restaurant.
 * Returns which accounts exist and which need to be created.
 */
router.get("/staff-setup-status/:restaurantId", async (req, res) => {
  try {
    const { restaurantId } = req.params;

    // Verify restaurant exists
    const restaurant = await Restaurant.findByPk(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    // Check for existing staff accounts
    const kitchenUsername = `kitchen_${restaurant.slug.replace(/-/g, '_')}`;
    const captainUsername = `captain_${restaurant.slug.replace(/-/g, '_')}`;

    const kitchenUser = await User.findOne({ 
      where: { username: kitchenUsername, restaurantId, role: 'kitchen' } 
    });

    const captainUser = await User.findOne({ 
      where: { username: captainUsername, restaurantId, role: 'captain' } 
    });

    res.json({
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      setupComplete: !!(kitchenUser && captainUser),
      accounts: {
        kitchen: {
          exists: !!kitchenUser,
          username: kitchenUsername
        },
        captain: {
          exists: !!captainUser,
          username: captainUsername
        }
      }
    });

  } catch (error) {
    console.error("[RESTAURANT AUTH] Staff setup status error:", error);
    res.status(500).json({ 
      message: "Server error checking staff setup status", 
      error: error.message 
    });
  }
});

// ============================
// Update Kitchen and Captain Passwords
// ============================
/**
 * PUT /api/restaurant/update-staff-passwords
 * 
 * Updates passwords for existing kitchen and/or captain accounts.
 * Creates accounts if they don't exist.
 * 
 * Request Body:
 * {
 *   "restaurantId": number,
 *   "kitchenPassword": string (optional, min 6 chars),
 *   "captainPassword": string (optional, min 6 chars)
 * }
 */
router.put("/update-staff-passwords", async (req, res) => {
  console.log("[RESTAURANT AUTH] Staff password update request received");
  
  try {
    const { restaurantId, kitchenPassword, captainPassword } = req.body;
    
    // Validate required fields
    if (!restaurantId) {
      return res.status(400).json({ 
        message: "Restaurant ID is required" 
      });
    }

    if (!kitchenPassword && !captainPassword) {
      return res.status(400).json({ 
        message: "At least one password (kitchen or captain) must be provided" 
      });
    }

    // Validate password length if provided
    if (kitchenPassword && kitchenPassword.length < 6) {
      return res.status(400).json({ 
        message: "Kitchen password must be at least 6 characters long" 
      });
    }

    if (captainPassword && captainPassword.length < 6) {
      return res.status(400).json({ 
        message: "Captain password must be at least 6 characters long" 
      });
    }

    // Verify restaurant exists
    const restaurant = await Restaurant.findByPk(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    const updates = [];

    // Update kitchen password if provided
    if (kitchenPassword) {
      const kitchenUsername = `kitchen_${restaurant.slug.replace(/-/g, '_')}`;
      const kitchenUser = await User.findOne({ 
        where: { username: kitchenUsername, restaurantId, role: 'kitchen' } 
      });

      if (kitchenUser) {
        kitchenUser.password = kitchenPassword; // Will be hashed by Sequelize hook
        await kitchenUser.save();
        updates.push('kitchen');
        console.log(`[RESTAURANT AUTH] ✓ Kitchen password updated`);
      } else {
        console.log(`[RESTAURANT AUTH] Kitchen account not found, creating new one`);
        await User.create({
          username: kitchenUsername,
          password: kitchenPassword,
          role: 'kitchen',
          restaurantId: restaurant.id,
          isOnline: false,
          lastActive: new Date()
        });
        updates.push('kitchen (created)');
      }
    }

    // Update captain password if provided
    if (captainPassword) {
      const captainUsername = `captain_${restaurant.slug.replace(/-/g, '_')}`;
      const captainUser = await User.findOne({ 
        where: { username: captainUsername, restaurantId, role: 'captain' } 
      });

      if (captainUser) {
        captainUser.password = captainPassword; // Will be hashed by Sequelize hook
        await captainUser.save();
        updates.push('captain');
        console.log(`[RESTAURANT AUTH] ✓ Captain password updated`);
      } else {
        console.log(`[RESTAURANT AUTH] Captain account not found, creating new one`);
        await User.create({
          username: captainUsername,
          password: captainPassword,
          role: 'captain',
          restaurantId: restaurant.id,
          isOnline: false,
          lastActive: new Date()
        });
        updates.push('captain (created)');
      }
    }

    res.json({
      message: "Staff passwords updated successfully",
      updated: updates
    });

  } catch (error) {
    console.error("[RESTAURANT AUTH] Staff password update error:", error);
    res.status(500).json({ 
      message: "Server error during password update", 
      error: error.message 
    });
  }
});

export default router;