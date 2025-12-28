import express from 'express';
import { authenticateRestaurant } from '../middleware/auth.js';
import createPaymentAdapter from '../services/payment/factory.js';
import Bill from '../models/Bill.js';

import Order from '../models/Order.js';

const router = express.Router();

// Initialize Payment (Create Order)
router.post('/initiate', authenticateRestaurant, async (req, res) => {
  try {
    const { billId, gateway = 'mock' } = req.body;
    const restaurantId = req.restaurantId;

    const bill = await Bill.findOne({ where: { id: billId, restaurantId } });
    if (!bill) {
      return res.status(404).json({ success: false, message: 'Bill not found' });
    }

    if (bill.status === 'paid') {
      return res.status(400).json({ success: false, message: 'Bill already paid' });
    }

    // Amount in currency subunits (e.g. paise for INR). 
    // Assuming database stores standard units (INR), so multiply by 100.
    // For Mock, we just pass the value.
    const amount = Math.round(parseFloat(bill.grandTotal) * 100);

    const adapter = createPaymentAdapter(gateway);
    const orderData = await adapter.createOrder(amount, 'INR', bill.billNumber);

    // Save gateway context if needed, for now just return to frontend
    res.json({ success: true, order: orderData, gateway });

  } catch (error) {
    console.error('Payment initiation error:', error);
    res.status(500).json({ success: false, message: 'Payment init failed' });
  }
});

// Update Payment Status (Manual Cash/Card/UPI)
router.post('/status', authenticateRestaurant, async (req, res) => {
  try {
    const { orderId, paymentMethod, paymentStatus, transactionId } = req.body;
    const restaurantId = req.restaurantId;

    console.log(`[PAYMENT] Updating status for Order ${orderId}: ${paymentStatus} via ${paymentMethod}`);

    const order = await Order.findOne({ where: { id: orderId, restaurantId } });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Update Order
    order.paymentStatus = paymentStatus;
    if (paymentMethod) order.paymentMethod = paymentMethod;
    if (transactionId) order.transactionId = transactionId;

    if (paymentStatus === 'paid') {
      order.paymentProcessedAt = new Date();
    }

    await order.save();

    // If there's a linked Bill, update it too (Good for consistency)
    // Note: Order model doesn't strictly link to Bill in all flows yet, but POS flow might.
    // Checking via Bill model reverse lookup if needed, or just relying on Order for now.

    res.json({ success: true, message: 'Payment status updated', order });

  } catch (error) {
    console.error('Payment status update error:', error);
    res.status(500).json({ success: false, message: 'Failed to update status' });
  }
});

// Verify Payment
router.post('/verify', authenticateRestaurant, async (req, res) => {
  try {
    const { billId, gateway = 'mock', paymentDetails } = req.body;
    const restaurantId = req.restaurantId;

    const bill = await Bill.findOne({ where: { id: billId, restaurantId } });
    if (!bill) {
      return res.status(404).json({ success: false, message: 'Bill not found' });
    }

    const adapter = createPaymentAdapter(gateway);
    const isValid = await adapter.verifyPayment(paymentDetails);

    if (isValid) {
      // Update Bill
      bill.status = 'paid';
      bill.paymentMethod = gateway === 'mock' ? 'card' : 'upi'; // Map to closest enum or expand enum
      bill.transactionId = paymentDetails.paymentId || 'mock_txn';
      bill.gateway = gateway;
      bill.gatewayResponse = paymentDetails;
      await bill.save();

      res.json({ success: true, message: 'Payment verified and Bill updated' });
    } else {
      res.status(400).json({ success: false, message: 'Payment verification failed' });
    }

  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ success: false, message: 'Verification error' });
  }
});

export default router;
