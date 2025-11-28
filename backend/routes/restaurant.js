import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Restaurant from "../models/Restaurant.js";

const router = express.Router();

// ============================
// Restaurant Signup Route
// ============================
router.post("/signup", async (req, res) => {
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

    // Check if restaurant already exists
    const existingRestaurant = await Restaurant.findOne({ where: { email: email.toLowerCase() } });
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
    
    // Check if slug already exists and make it unique
    let uniqueSlug = slug;
    let counter = 1;
    while (await Restaurant.findOne({ where: { slug: uniqueSlug } })) {
      uniqueSlug = `${slug}-${counter}`;
      counter++;
    }

    // Generate unique restaurant code (QS + 4 digits)
    let restaurantCode;
    let isCodeUnique = false;
    while (!isCodeUnique) {
      // Generate random 4-digit number (1000-9999)
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      restaurantCode = `QS${randomNum}`;
      
      // Check if code already exists
      const existingCode = await Restaurant.findOne({ where: { restaurantCode } });
      if (!existingCode) {
        isCodeUnique = true;
      }
    }

    console.log(`[RESTAURANT AUTH] Generated unique code: ${restaurantCode}`);

    // Create new restaurant (password will be hashed by Sequelize hook)
    const restaurant = await Restaurant.create({
      name: name.trim(),
      slug: uniqueSlug,
      restaurantCode: restaurantCode,
      email: email.toLowerCase().trim(),
      password: password,
      phone: phone.trim(),
      address: address.trim(),
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
    };

    res.status(201).json({
      message: "Restaurant registered successfully",
      restaurant: restaurantData,
      token,
    });

  } catch (error) {
    console.error("[RESTAURANT AUTH] Signup error:", error);
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

    // Find restaurant by email
    const restaurant = await Restaurant.findOne({ 
      where: {
        email: email.toLowerCase().trim(),
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
// Get Restaurant Info by Code (for admin view)
// ============================
router.get("/info/:restaurantCode", async (req, res) => {
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

export default router;