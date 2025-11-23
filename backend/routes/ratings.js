import express from "express";
import Rating from "../models/Rating.js";
import Order from "../models/Order.js";
import MenuItem from "../models/MenuItem.js";

const router = express.Router();

// ============================
// Create Rating
// ============================
router.post("/", async (req, res) => {
  try {
    const { orderId, customerId, customerPhone, rating, review, itemRatings } =
      req.body;

    console.log("[RATING] New rating submission:", {
      orderId,
      rating,
      customerId,
    });

    // Validate required fields
    if (!orderId || !rating) {
      return res
        .status(400)
        .json({ message: "Order ID and rating are required" });
    }

    // Validate rating range
    if (rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ message: "Rating must be between 1 and 5" });
    }

    // Check if order exists
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if rating already exists for this order
    const existingRating = await Rating.findOne({ orderId });
    if (existingRating) {
      return res
        .status(400)
        .json({ message: "Rating already submitted for this order" });
    }

    // Create new rating
    const newRating = new Rating({
      orderId,
      orderNumber: order.orderNumber,
      customerId: customerId || null,
      customerPhone: customerPhone || order.customerPhone,
      rating,
      review: review || "",
      itemRatings: itemRatings || [],
    });

    await newRating.save();

    console.log("[RATING] ✓ Rating saved successfully:", newRating._id);

    // Update menu item ratings for all items in the order
    if (order.items && order.items.length > 0) {
      console.log("[RATING] Updating ratings for menu items in order");

      for (const item of order.items) {
        if (item.menuItemId) {
          try {
            const menuItem = await MenuItem.findById(item.menuItemId);

            if (menuItem) {
              // Add the rating to the sum and increment count
              menuItem.ratingSum = (menuItem.ratingSum || 0) + rating;
              menuItem.totalRatings = (menuItem.totalRatings || 0) + 1;

              // Calculate new average
              menuItem.averageRating =
                menuItem.ratingSum / menuItem.totalRatings;

              await menuItem.save();

              console.log(
                `[RATING] ✓ Updated rating for "${
                  menuItem.name
                }": ${menuItem.averageRating.toFixed(2)} (${
                  menuItem.totalRatings
                } ratings)`
              );
            }
          } catch (itemError) {
            console.error(
              `[RATING] Error updating rating for item ${item.menuItemId}:`,
              itemError
            );
            // Continue with other items even if one fails
          }
        }
      }
    }

    // Emit socket event for new rating (optional - for admin dashboard)
    const io = req.app.get("io");
    if (io) {
      io.emit("new-rating", {
        orderId: newRating.orderId,
        rating: newRating.rating,
        orderNumber: newRating.orderNumber,
      });
    }

    res.status(201).json({
      success: true,
      message: "Thank you for your feedback!",
      rating: {
        id: newRating._id,
        orderId: newRating.orderId,
        rating: newRating.rating,
        review: newRating.review,
        createdAt: newRating.createdAt,
      },
    });
  } catch (error) {
    console.error("[RATING] Error creating rating:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ============================
// Get Ratings for an Order
// ============================
router.get("/order/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;

    const rating = await Rating.findOne({ orderId }).populate("orderId");

    if (!rating) {
      return res
        .status(404)
        .json({ message: "No rating found for this order" });
    }

    res.json(rating);
  } catch (error) {
    console.error("[RATING] Error fetching rating:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ============================
// Get All Ratings (for Admin)
// ============================
router.get("/", async (req, res) => {
  try {
    const { minRating, maxRating, startDate, endDate, limit = 50 } = req.query;

    const filter = {};

    // Filter by rating range
    if (minRating || maxRating) {
      filter.rating = {};
      if (minRating) filter.rating.$gte = parseInt(minRating);
      if (maxRating) filter.rating.$lte = parseInt(maxRating);
    }

    // Filter by date range
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const ratings = await Rating.find(filter)
      .populate("orderId")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json(ratings);
  } catch (error) {
    console.error("[RATING] Error fetching ratings:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ============================
// Get Rating Statistics
// ============================
router.get("/stats", async (req, res) => {
  try {
    const stats = await Rating.aggregate([
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
          totalRatings: { $sum: 1 },
          fiveStars: {
            $sum: { $cond: [{ $eq: ["$rating", 5] }, 1, 0] },
          },
          fourStars: {
            $sum: { $cond: [{ $eq: ["$rating", 4] }, 1, 0] },
          },
          threeStars: {
            $sum: { $cond: [{ $eq: ["$rating", 3] }, 1, 0] },
          },
          twoStars: {
            $sum: { $cond: [{ $eq: ["$rating", 2] }, 1, 0] },
          },
          oneStar: {
            $sum: { $cond: [{ $eq: ["$rating", 1] }, 1, 0] },
          },
        },
      },
    ]);

    res.json(
      stats[0] || {
        averageRating: 0,
        totalRatings: 0,
        fiveStars: 0,
        fourStars: 0,
        threeStars: 0,
        twoStars: 0,
        oneStar: 0,
      }
    );
  } catch (error) {
    console.error("[RATING] Error fetching stats:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ============================
// Get Menu Item Rating
// ============================
router.get("/menu-item/:menuItemId", async (req, res) => {
  try {
    const { menuItemId } = req.params;

    const menuItem = await MenuItem.findById(menuItemId);

    if (!menuItem) {
      return res.status(404).json({ message: "Menu item not found" });
    }

    res.json({
      menuItemId: menuItem._id,
      name: menuItem.name,
      averageRating: menuItem.averageRating || 0,
      totalRatings: menuItem.totalRatings || 0,
    });
  } catch (error) {
    console.error("[RATING] Error fetching menu item rating:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ============================
// Get Top Rated Menu Items
// ============================
router.get("/menu-items/top-rated", async (req, res) => {
  try {
    const { limit = 10, minRatings = 1 } = req.query;

    const topRatedItems = await MenuItem.find({
      totalRatings: { $gte: parseInt(minRatings) },
    })
      .sort({ averageRating: -1, totalRatings: -1 })
      .limit(parseInt(limit))
      .select("name category averageRating totalRatings price image");

    res.json(topRatedItems);
  } catch (error) {
    console.error("[RATING] Error fetching top rated items:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;
