import express from "express";
import { Op } from "sequelize";
import { tenantMiddleware, requireTenant } from "../middleware/tenantMiddleware.js";

const router = express.Router();

// Apply tenant middleware to all routes
router.use(tenantMiddleware);

// ============================
// Create Rating
// ============================
router.post("/", requireTenant, async (req, res) => {
  try {
    const { Rating: TenantRating, Order: TenantOrder, MenuItem: TenantMenuItem } = req.tenant.models;
    const { orderId, customerId, customerPhone, rating, review, itemRatings } = req.body;

    console.log(`[RATING] New rating submission for ${req.tenant.slug}:`, {
      orderId,
      rating,
      customerId,
    });

    // Validate required fields
    if (!orderId || !rating) {
      return res.status(400).json({ message: "Order ID and rating are required" });
    }

    // Validate rating range
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    // Check if order exists
    const order = await TenantOrder.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if rating already exists for this order
    const existingRating = await TenantRating.findOne({ where: { orderId } });
    if (existingRating) {
      return res.status(400).json({ message: "Rating already submitted for this order" });
    }

    // Create new rating
    const newRating = await TenantRating.create({
      orderId,
      orderNumber: order.orderNumber,
      customerId: customerId || null,
      customerPhone: customerPhone || order.customerPhone,
      rating,
      review: review || "",
      itemRatings: itemRatings || [],
    });

    console.log("[RATING] ✓ Rating saved successfully:", newRating.id);

    // Update menu item ratings for all items in the order
    if (order.items && order.items.length > 0) {
      console.log("[RATING] Updating ratings for menu items in order");

      for (const item of order.items) {
        if (item.menuItemId) {
          try {
            const menuItem = await TenantMenuItem.findByPk(item.menuItemId);

            if (menuItem) {
              menuItem.ratingSum = (menuItem.ratingSum || 0) + rating;
              menuItem.totalRatings = (menuItem.totalRatings || 0) + 1;
              menuItem.averageRating = menuItem.ratingSum / menuItem.totalRatings;
              await menuItem.save();

              console.log(
                `[RATING] ✓ Updated rating for "${menuItem.name}": ${parseFloat(menuItem.averageRating).toFixed(2)} (${menuItem.totalRatings} ratings)`
              );
            }
          } catch (itemError) {
            console.error(`[RATING] Error updating rating for item ${item.menuItemId}:`, itemError);
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
        id: newRating.id,
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
router.get("/order/:orderId", requireTenant, async (req, res) => {
  try {
    const { Rating: TenantRating, Order: TenantOrder } = req.tenant.models;
    const { orderId } = req.params;

    const rating = await TenantRating.findOne({ 
      where: { orderId },
      include: [{ model: TenantOrder }],
    });

    if (!rating) {
      return res.status(404).json({ message: "No rating found for this order" });
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
router.get("/", requireTenant, async (req, res) => {
  try {
    const { Rating: TenantRating, Order: TenantOrder } = req.tenant.models;
    const { minRating, maxRating, startDate, endDate, limit = 50 } = req.query;

    const filter = {};

    // Filter by rating range
    if (minRating || maxRating) {
      filter.rating = {};
      if (minRating) filter.rating[Op.gte] = parseInt(minRating);
      if (maxRating) filter.rating[Op.lte] = parseInt(maxRating);
    }

    // Filter by date range
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt[Op.gte] = new Date(startDate);
      if (endDate) filter.createdAt[Op.lte] = new Date(endDate);
    }

    const ratings = await TenantRating.findAll({
      where: filter,
      include: [{ model: TenantOrder }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
    });

    console.log(`[RATING] Retrieved ${ratings.length} ratings for ${req.tenant.slug}`);
    res.json(ratings);
  } catch (error) {
    console.error("[RATING] Error fetching ratings:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ============================
// Get Rating Statistics
// ============================
router.get("/stats", requireTenant, async (req, res) => {
  try {
    const { Rating: TenantRating } = req.tenant.models;
    const tenantDb = TenantRating.sequelize;
    const schemaName = `tenant_${req.tenant.slug}`;

    const [results] = await tenantDb.query(`
      SELECT 
        AVG(rating)::float as "averageRating",
        COUNT(*)::int as "totalRatings",
        SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END)::int as "fiveStars",
        SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END)::int as "fourStars",
        SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END)::int as "threeStars",
        SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END)::int as "twoStars",
        SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END)::int as "oneStar"
      FROM "${schemaName}".ratings
    `);

    res.json(
      results[0] || {
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
router.get("/menu-item/:menuItemId", requireTenant, async (req, res) => {
  try {
    const { MenuItem: TenantMenuItem } = req.tenant.models;
    const { menuItemId } = req.params;

    const menuItem = await TenantMenuItem.findByPk(menuItemId);

    if (!menuItem) {
      return res.status(404).json({ message: "Menu item not found" });
    }

    res.json({
      menuItemId: menuItem.id,
      name: menuItem.name,
      averageRating: parseFloat(menuItem.averageRating) || 0,
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
router.get("/menu-items/top-rated", requireTenant, async (req, res) => {
  try {
    const { MenuItem: TenantMenuItem } = req.tenant.models;
    const { limit = 10, minRatings = 1 } = req.query;

    const topRatedItems = await TenantMenuItem.findAll({
      where: {
        totalRatings: {
          [Op.gte]: parseInt(minRatings),
        },
      },
      attributes: ['id', 'name', 'category', 'averageRating', 'totalRatings', 'price', 'image'],
      order: [
        ['averageRating', 'DESC'],
        ['totalRatings', 'DESC'],
      ],
      limit: parseInt(limit),
    });

    res.json(topRatedItems);
  } catch (error) {
    console.error("[RATING] Error fetching top rated items:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;
