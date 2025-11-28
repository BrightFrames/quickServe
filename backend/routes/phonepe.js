import express from 'express';
import phonePeService from '../services/phonePeService.js';
import Order from '../models/Order.js';
import Restaurant from '../models/Restaurant.js';

const router = express.Router();

/**
 * POST /api/payment/phonepe/initiate
 * Initiate PhonePe payment for an order
 */
router.post('/phonepe/initiate', async (req, res) => {
  try {
    const {
      orderId,
      amount,
      restaurantId,
      customerPhone,
      customerName,
      customerEmail,
    } = req.body;

    // Validate required fields
    if (!orderId || !amount || !restaurantId || !customerPhone) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    // Get restaurant details
    const restaurant = await Restaurant.findByPk(restaurantId);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found',
      });
    }

    // Get restaurant's PhonePe merchant ID from settings
    const restaurantMerchantId = restaurant.settings?.phonePeMerchantId || null;
    const platformFee = restaurant.settings?.platformFee || 0; // Commission in rupees

    console.log(`[PHONEPE] Initiating payment for order ${orderId}`);
    console.log(`[PHONEPE] Restaurant: ${restaurant.name}, Merchant ID: ${restaurantMerchantId}`);
    console.log(`[PHONEPE] Amount: ₹${amount}, Platform Fee: ₹${platformFee}`);

    // Initiate payment
    const paymentResponse = await phonePeService.initiatePayment({
      orderId,
      amount,
      restaurantMerchantId,
      customerPhone,
      customerName: customerName || 'Customer',
      platformFee,
    });

    // Update order with transaction ID
    await Order.update(
      {
        transactionId: paymentResponse.transactionId,
        paymentStatus: 'pending',
      },
      {
        where: { id: orderId },
      }
    );

    console.log(`[PHONEPE] Payment URL generated: ${paymentResponse.paymentUrl}`);

    res.json({
      success: true,
      transactionId: paymentResponse.transactionId,
      paymentUrl: paymentResponse.paymentUrl,
      message: 'Payment initiated successfully',
    });
  } catch (error) {
    console.error('[PHONEPE] Payment initiation failed:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to initiate payment',
    });
  }
});

/**
 * POST /api/payment/phonepe/callback
 * PhonePe webhook callback
 */
router.post('/phonepe/callback', async (req, res) => {
  try {
    const { response } = req.body;
    const xVerify = req.headers['x-verify'];

    console.log('[PHONEPE] Webhook received');

    // Verify signature
    if (!phonePeService.verifyWebhookSignature(xVerify, response)) {
      console.error('[PHONEPE] Invalid webhook signature');
      return res.status(401).json({
        success: false,
        message: 'Invalid signature',
      });
    }

    // Decode response
    const decodedResponse = JSON.parse(
      Buffer.from(response, 'base64').toString('utf-8')
    );

    const { merchantTransactionId, transactionId, amount, code, state } = decodedResponse.data;

    console.log(`[PHONEPE] Transaction ${merchantTransactionId}: ${state} (${code})`);

    // Extract order ID from transaction ID
    const orderIdMatch = merchantTransactionId.match(/TXN_(\d+)_/);
    if (!orderIdMatch) {
      console.error('[PHONEPE] Invalid transaction ID format');
      return res.status(400).json({ success: false });
    }

    const orderId = orderIdMatch[1];

    // Update order based on payment status
    if (state === 'COMPLETED' && code === 'PAYMENT_SUCCESS') {
      await Order.update(
        {
          paymentStatus: 'paid',
          transactionId: transactionId,
        },
        {
          where: { id: orderId },
        }
      );

      console.log(`[PHONEPE] ✅ Order ${orderId} payment confirmed`);
    } else if (state === 'FAILED') {
      await Order.update(
        {
          paymentStatus: 'failed',
        },
        {
          where: { id: orderId },
        }
      );

      console.log(`[PHONEPE] ❌ Order ${orderId} payment failed`);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('[PHONEPE] Webhook processing error:', error);
    res.status(500).json({ success: false });
  }
});

/**
 * GET /api/payment/phonepe/status/:transactionId
 * Check payment status
 */
router.get('/phonepe/status/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;

    console.log(`[PHONEPE] Checking status for transaction: ${transactionId}`);

    const status = await phonePeService.checkPaymentStatus(transactionId);

    res.json({
      success: true,
      status: status.data.state,
      code: status.code,
      message: status.message,
      data: status.data,
    });
  } catch (error) {
    console.error('[PHONEPE] Status check failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check payment status',
    });
  }
});

/**
 * POST /api/payment/phonepe/refund
 * Initiate refund
 */
router.post('/phonepe/refund', async (req, res) => {
  try {
    const { orderId, amount, reason } = req.body;

    if (!orderId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Order ID and amount are required',
      });
    }

    // Get order details
    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    if (order.paymentStatus !== 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Order payment is not completed',
      });
    }

    console.log(`[PHONEPE] Initiating refund for order ${orderId}, amount: ₹${amount}`);

    const refundResponse = await phonePeService.initiateRefund({
      originalTransactionId: order.transactionId,
      orderId,
      amount,
    });

    // Update order status
    await Order.update(
      {
        paymentStatus: 'refunded',
      },
      {
        where: { id: orderId },
      }
    );

    console.log(`[PHONEPE] Refund initiated successfully`);

    res.json({
      success: true,
      transactionId: refundResponse.transactionId,
      message: 'Refund initiated successfully',
    });
  } catch (error) {
    console.error('[PHONEPE] Refund failed:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to initiate refund',
    });
  }
});

/**
 * POST /api/payment/phonepe/qr
 * Generate QR code for payment
 */
router.post('/phonepe/qr', async (req, res) => {
  try {
    const { orderId, amount, restaurantId } = req.body;

    if (!orderId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Order ID and amount are required',
      });
    }

    // Get restaurant merchant ID
    let restaurantMerchantId = null;
    if (restaurantId) {
      const restaurant = await Restaurant.findByPk(restaurantId);
      restaurantMerchantId = restaurant?.settings?.phonePeMerchantId;
    }

    console.log(`[PHONEPE] Generating QR code for order ${orderId}`);

    const qrResponse = await phonePeService.generateQRCode({
      orderId,
      amount,
      restaurantMerchantId,
    });

    res.json({
      success: true,
      qrString: qrResponse.qrString,
      transactionId: qrResponse.transactionId,
      message: 'QR code generated successfully',
    });
  } catch (error) {
    console.error('[PHONEPE] QR generation failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate QR code',
    });
  }
});

export default router;
