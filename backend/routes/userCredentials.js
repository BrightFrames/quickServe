import express from "express";
import bcrypt from "bcryptjs";
import { authenticateRestaurant } from "../middleware/auth.js";
import { requireRole, enforceTenantIsolation } from "../middleware/rbac.js";
import User from "../models/User.js";
import Restaurant from "../models/Restaurant.js";

const router = express.Router();

/**
 * Update user credentials (username/password)
 * Requires current password for security
 * POST /api/users/update-credentials
 */
router.post(
  "/update-credentials",
  authenticateRestaurant,
  enforceTenantIsolation,
  async (req, res) => {
    try {
      const {
        currentPassword,
        newUsername,
        newPassword,
        confirmPassword,
      } = req.body;

      // Validation
      if (!currentPassword) {
        return res.status(400).json({
          message: "Current password is required for security verification",
        });
      }

      if (!newUsername && !newPassword) {
        return res.status(400).json({
          message: "Provide at least one field to update (username or password)",
        });
      }

      if (newPassword && newPassword !== confirmPassword) {
        return res.status(400).json({
          message: "New passwords do not match",
        });
      }

      if (newPassword && newPassword.length < 6) {
        return res.status(400).json({
          message: "New password must be at least 6 characters long",
        });
      }

      // Find user
      const userId = req.userId;
      const restaurantId = req.restaurantId;

      let user;
      if (req.userRole) {
        // Staff user (kitchen, captain, etc.)
        user = await User.findOne({
          where: {
            id: userId,
            restaurantId: restaurantId,
          },
        });
      } else {
        // Restaurant owner
        user = await Restaurant.findByPk(restaurantId);
      }

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Verify current password
      const isPasswordValid = await user.comparePassword(currentPassword);
      if (!isPasswordValid) {
        return res.status(401).json({
          message: "Current password is incorrect",
        });
      }

      // Check if new username is unique (within restaurant for staff)
      if (newUsername && newUsername !== user.username) {
        if (req.userRole) {
          // Staff user - check uniqueness within restaurant
          const existingUser = await User.findOne({
            where: {
              restaurantId: restaurantId,
              username: newUsername,
            },
          });

          if (existingUser) {
            return res.status(400).json({
              message: "Username already taken in this restaurant",
            });
          }

          user.username = newUsername;
        } else {
          // Restaurant owner - check email uniqueness globally
          const existingRestaurant = await Restaurant.findOne({
            where: {
              email: newUsername, // For restaurants, username = email
            },
          });

          if (existingRestaurant && existingRestaurant.id !== user.id) {
            return res.status(400).json({
              message: "Email already taken",
            });
          }

          user.email = newUsername;
        }
      }

      // Update password (will be hashed by model hook)
      if (newPassword) {
        user.password = newPassword;
      }

      // Save changes
      await user.save();

      console.log(`[CREDENTIALS] ✓ Updated credentials for user ${user.id}`);

      res.json({
        message: "Credentials updated successfully",
        user: {
          id: user.id,
          username: user.username || user.email,
          role: user.role || "admin",
        },
      });
    } catch (error) {
      console.error("[CREDENTIALS] Update error:", error);
      res.status(500).json({
        message: "Server error",
        error: error.message,
      });
    }
  }
);

/**
 * Change password for staff users (admin action)
 * POST /api/users/:userId/reset-password
 */
router.post(
  "/:userId/reset-password",
  authenticateRestaurant,
  requireRole(["admin"]),
  enforceTenantIsolation,
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { newPassword } = req.body;
      const restaurantId = req.restaurantId;

      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({
          message: "New password must be at least 6 characters long",
        });
      }

      // Find user in the same restaurant
      const user = await User.findOne({
        where: {
          id: userId,
          restaurantId: restaurantId,
        },
      });

      if (!user) {
        return res.status(404).json({
          message: "User not found in your restaurant",
        });
      }

      // Update password (will be hashed by model hook)
      user.password = newPassword;
      await user.save();

      console.log(`[ADMIN] ✓ Reset password for user ${userId}`);

      res.json({
        message: "Password reset successfully",
        user: {
          id: user.id,
          username: user.username,
        },
      });
    } catch (error) {
      console.error("[ADMIN] Password reset error:", error);
      res.status(500).json({
        message: "Server error",
        error: error.message,
      });
    }
  }
);

export default router;
