import express from "express";
import Restaurant from "../models/Restaurant.js";

const router = express.Router();

// Verify customer access code
router.post("/verify-access", async (req, res) => {
  try {
    const { slug, accessCode } = req.body;

    if (!slug || !accessCode) {
      return res.status(400).json({ 
        success: false,
        message: "Restaurant slug and access code are required" 
      });
    }

    // Find restaurant by slug
    const restaurant = await Restaurant.findOne({ where: { slug } });

    if (!restaurant) {
      return res.status(404).json({ 
        success: false,
        message: "Restaurant not found" 
      });
    }

    // Check if restaurant has access code set
    if (!restaurant.customerAccessCode) {
      // No access code set - allow access
      return res.json({ 
        success: true,
        requiresAuth: false,
        message: "Access granted - no authentication required",
        restaurant: {
          name: restaurant.name,
          slug: restaurant.slug
        }
      });
    }

    // Verify access code
    if (restaurant.customerAccessCode === accessCode) {
      return res.json({ 
        success: true,
        requiresAuth: true,
        message: "Access code verified successfully",
        restaurant: {
          name: restaurant.name,
          slug: restaurant.slug
        }
      });
    } else {
      return res.status(401).json({ 
        success: false,
        message: "Invalid access code" 
      });
    }

  } catch (error) {
    console.error("[CUSTOMER AUTH] Error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error", 
      error: error.message 
    });
  }
});

// Check if restaurant requires authentication
router.get("/check-auth/:slug", async (req, res) => {
  try {
    const { slug } = req.params;

    const restaurant = await Restaurant.findOne({ where: { slug } });

    if (!restaurant) {
      return res.status(404).json({ 
        success: false,
        message: "Restaurant not found" 
      });
    }

    res.json({ 
      success: true,
      requiresAuth: !!restaurant.customerAccessCode,
      restaurant: {
        name: restaurant.name,
        slug: restaurant.slug
      }
    });

  } catch (error) {
    console.error("[CUSTOMER AUTH] Error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error", 
      error: error.message 
    });
  }
});

export default router;
