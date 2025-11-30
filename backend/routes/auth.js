import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Op } from "sequelize";
import User from "../models/User.js";
import Restaurant from "../models/Restaurant.js";

const router = express.Router();

// ============================
// Login Route
// ============================
router.post("/login", async (req, res) => {
  console.log("[AUTH] Login request received");
  console.log("[AUTH] Body:", req.body);

  try {
    const { username, password, role, restaurantCode } = req.body;

    // Validate required fields
    if (!username || !password || !role) {
      console.log("[AUTH] Missing required fields");
      return res
        .status(400)
        .json({ message: "Username, password, and role are required" });
    }

    console.log(`[AUTH] Attempting login for user: ${username}, role: ${role}`);

    // Check if it's admin login
    if (role === "admin") {
      console.log("[AUTH] Processing admin login...");
      
      // Admin login requires restaurant code for restaurant-specific access
      if (!restaurantCode) {
        console.log("[AUTH] ✗ Restaurant code required for admin login");
        return res.status(400).json({ message: "Restaurant code is required for admin access" });
      }
      
      // Find restaurant by code
      const restaurant = await Restaurant.findOne({ 
        where: { restaurantCode } 
      });

      if (!restaurant) {
        console.log("[AUTH] ✗ Restaurant not found");
        return res.status(401).json({ message: "Invalid restaurant code" });
      }

      // Check if custom admin credentials are set
      const customAdminUsername = restaurant.settings?.credentials?.adminUsername;
      const customAdminPassword = restaurant.settings?.credentials?.adminPassword;
      
      let isValidCredentials = false;
      
      if (customAdminPassword || customAdminUsername) {
        // Use custom restaurant-specific admin credentials
        console.log("[AUTH] Checking custom admin credentials...");
        
        // Check username if custom username is set
        const isUsernameValid = customAdminUsername ? username === customAdminUsername : true;
        // Check password if custom password is set
        const isPasswordValid = customAdminPassword 
          ? await bcrypt.compare(password, customAdminPassword)
          : password === process.env.ADMIN_PASSWORD;
        
        isValidCredentials = isUsernameValid && isPasswordValid;
        console.log("[AUTH] Custom credentials check - username:", isUsernameValid, "password:", isPasswordValid);
      } else {
        // Fallback to default admin credentials from .env
        console.log("[AUTH] Using default admin credentials...");
        isValidCredentials = (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD);
      }
      
      if (isValidCredentials) {
        console.log("[AUTH] ✓ Admin credentials valid for restaurant:", restaurantCode);
        const token = jwt.sign(
          { id: "admin", username, role: "admin", restaurantCode },
          process.env.JWT_SECRET,
          { expiresIn: "24h" }
        );

        return res.json({
          user: { id: "admin", username, role: "admin", restaurantCode },
          token,
        });
      } else {
        console.log("[AUTH] ✗ Invalid admin credentials");
        return res.status(401).json({ message: "Invalid admin credentials" });
      }
    }

    // Kitchen/Cook/Captain login - ONLY from User table, NOT admin credentials
    console.log("[AUTH] Processing kitchen/cook/captain login...");
    
    // Prevent admin credentials from accessing kitchen/captain dashboard
    if (username === process.env.ADMIN_USERNAME) {
      console.log("[AUTH] ✗ Admin credentials cannot be used for staff login");
      return res.status(401).json({ message: "Invalid credentials. Please use staff credentials." });
    }
    
    const user = await User.findOne({
      where: {
        username,
        role: {
          [Op.in]: ["kitchen", "cook", "captain"],
        },
      },
    });
    if (!user) {
      console.log("[AUTH] ✗ User not found");
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("[AUTH] ✗ Invalid password");
      return res.status(401).json({ message: "Invalid credentials" });
    }

    console.log("[AUTH] ✓ Kitchen/cook credentials valid");

    // Update user status
    user.isOnline = true;
    user.lastActive = new Date();
    await user.save();

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error("[AUTH] Server error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ============================
// Captain Login Route
// ============================
router.post("/captain/login", async (req, res) => {
  console.log("[AUTH] Captain login request received");
  console.log("[AUTH] Body:", req.body);

  try {
    const { username, password } = req.body;

    // Validate required fields
    if (!username || !password) {
      console.log("[AUTH] Missing required fields");
      return res.status(400).json({ message: "Username and password are required" });
    }

    console.log(`[AUTH] Attempting captain login for user: ${username}`);

    // Find captain user
    const user = await User.findOne({
      where: {
        username,
        role: "captain",
      },
    });

    if (!user) {
      console.log("[AUTH] ✗ Captain not found");
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("[AUTH] ✗ Invalid password");
      return res.status(401).json({ message: "Invalid credentials" });
    }

    console.log("[AUTH] ✓ Captain credentials valid");

    // Update user status
    user.isOnline = true;
    user.lastActive = new Date();
    await user.save();

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, restaurantId: user.restaurantId },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        restaurantId: user.restaurantId,
      },
      token,
    });
  } catch (error) {
    console.error("[AUTH] Server error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ============================
// Logout Route
// ============================
router.post("/logout", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.id !== "admin") {
        await User.update(
          { isOnline: false },
          { where: { id: decoded.id } }
        );
      }
    }
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Verify dashboard access from customer pages
router.post("/verify-dashboard-access", async (req, res) => {
  try {
    const { slug, password } = req.body;

    if (!slug || !password) {
      return res.status(400).json({
        success: false,
        message: "Restaurant slug and password are required",
      });
    }

    // Find restaurant by slug
    const restaurant = await Restaurant.findOne({
      where: { slug },
    });

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    // Verify password
    const isValidPassword = await restaurant.comparePassword(password);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
      });
    }

    res.json({
      success: true,
      message: "Access granted",
      restaurant: {
        name: restaurant.name,
        slug: restaurant.slug,
      },
    });
  } catch (error) {
    console.error("Dashboard access verification error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify access",
    });
  }
});

export default router;
