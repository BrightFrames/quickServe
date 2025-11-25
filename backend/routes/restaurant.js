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

    // Create new restaurant (password will be hashed by Sequelize hook)
    const restaurant = await Restaurant.create({
      name: name.trim(),
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
        email: restaurant.email,
        phone: restaurant.phone,
        address: restaurant.address,
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

export default router;