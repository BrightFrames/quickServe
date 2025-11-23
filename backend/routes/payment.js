import express from "express";
import Order from "../models/Order.js";

const router = express.Router();

// ============================
// UPI Payment Intent
// ============================
// Get UPI payment details for initiating payment
router.post("/upi/initiate", async (req, res) => {
  try {
    const { orderId, amount } = req.body;

    if (!orderId || !amount) {
      return res.status(400).json({ message: "Order ID and amount required" });
    }

    // Get UPI details from environment variables
    const upiId = process.env.UPI_ID || "test@upi";
    const businessName = process.env.BUSINESS_NAME || "QuickServe";

    // Generate UPI deep link
    const upiLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(
      businessName
    )}&am=${amount}&cu=INR&tn=${encodeURIComponent(
      `Order Payment - ${orderId}`
    )}`;

    console.log(
      `[PAYMENT] UPI payment initiated for order: ${orderId}, amount: ${amount}`
    );

    res.json({
      success: true,
      upiLink,
      upiId,
      businessName,
      amount,
      orderId,
    });
  } catch (error) {
    console.error("[PAYMENT] Error initiating UPI payment:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ============================
// Update Payment Status
// ============================
// Called after payment completion to update order status
router.post("/status", async (req, res) => {
  try {
    const { orderId, paymentMethod, paymentStatus, transactionId } = req.body;

    console.log(`[PAYMENT] Status update request:`, {
      orderId,
      paymentMethod,
      paymentStatus,
      transactionId,
    });

    if (!orderId || !paymentMethod || !paymentStatus) {
      return res.status(400).json({
        message: "Order ID, payment method, and payment status are required",
      });
    }

    // Validate payment status
    const validStatuses = ["pending", "paid", "failed"];
    if (!validStatuses.includes(paymentStatus)) {
      return res.status(400).json({
        message: `Invalid payment status. Must be one of: ${validStatuses.join(
          ", "
        )}`,
      });
    }

    // Validate payment method
    const validMethods = ["cash", "card", "upi"];
    if (!validMethods.includes(paymentMethod)) {
      return res.status(400).json({
        message: `Invalid payment method. Must be one of: ${validMethods.join(
          ", "
        )}`,
      });
    }

    // Find and update the order
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Update payment details
    order.paymentMethod = paymentMethod;
    order.paymentStatus = paymentStatus;

    if (transactionId) {
      order.transactionId = transactionId;
    }

    // If payment is successful, update order status to preparing
    if (paymentStatus === "paid" && order.status === "pending") {
      order.status = "preparing";
    }

    await order.save();

    console.log(`[PAYMENT] ✓ Payment status updated for order: ${orderId}`, {
      paymentMethod,
      paymentStatus,
      transactionId: transactionId || "N/A",
    });

    // Emit socket event for payment update
    const io = req.app.get("io");
    if (io) {
      io.emit("payment-updated", {
        orderId: order._id,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
      });
    }

    res.json({
      success: true,
      message: "Payment status updated successfully",
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        transactionId: order.transactionId,
        status: order.status,
      },
    });
  } catch (error) {
    console.error("[PAYMENT] Error updating payment status:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ============================
// Verify Payment (Optional - for UPI callback)
// ============================
// This endpoint can be called by UPI gateway or polling from frontend
router.get("/verify/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    console.log(`[PAYMENT] Payment verification check for order: ${orderId}`, {
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
    });

    res.json({
      success: true,
      orderId: order._id,
      orderNumber: order.orderNumber,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      transactionId: order.transactionId,
      totalAmount: order.totalAmount,
    });
  } catch (error) {
    console.error("[PAYMENT] Error verifying payment:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;
