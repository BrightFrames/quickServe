import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();

// ============================
// Login Route
// ============================
router.post("/login", async (req, res) => {
  console.log("[AUTH] Login request received");
  console.log("[AUTH] Body:", req.body);

  try {
    const { username, password, role } = req.body;

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
      if (
        username === process.env.ADMIN_USERNAME &&
        password === process.env.ADMIN_PASSWORD
      ) {
        console.log("[AUTH] ✓ Admin credentials valid");
        const token = jwt.sign(
          { id: "admin", username, role: "admin" },
          process.env.JWT_SECRET,
          { expiresIn: "24h" }
        );

        return res.json({
          user: { id: "admin", username, role: "admin" },
          token,
        });
      } else {
        console.log("[AUTH] ✗ Invalid admin credentials");
        return res.status(401).json({ message: "Invalid admin credentials" });
      }
    }

    // Kitchen/Cook login
    console.log("[AUTH] Processing kitchen/cook login...");
    const user = await User.findOne({
      username,
      role: { $in: ["kitchen", "cook"] },
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
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      user: {
        id: user._id,
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
// Logout Route
// ============================
router.post("/logout", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.id !== "admin") {
        await User.findByIdAndUpdate(decoded.id, { isOnline: false });
      }
    }
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
