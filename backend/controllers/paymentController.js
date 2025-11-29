import cashfreeService from '../utils/cashfree.js';
import Order from '../models/Order.js';
import Restaurant from '../models/Restaurant.js';

/**
 * Cashfree Payment Controller
 * Handles all Cashfree marketplace payment operations
 */

/**
 * Create or update restaurant vendor account in Cashfree
 * This should be called when restaurant registers or updates payment settings
 */
export const createVendorAccount = async (req, res) => {
  try {
    const { restaurantId } = req.body;

    if (!restaurantId) {
      return res.status(400).json({
        success: false,
        message: 'Restaurant ID is required',
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

    // Check if vendor account already exists
    if (restaurant.cashfreeVendorId) {
      console.log(`[PAYMENT] Vendor already exists: ${restaurant.cashfreeVendorId}`);
      return res.json({
        success: true,
        vendorId: restaurant.cashfreeVendorId,
        message: 'Vendor account already exists',
      });
    }

    console.log(`[PAYMENT] Creating Cashfree vendor for restaurant: ${restaurant.name}`);

    // Create vendor account in Cashfree
    const vendorId = await cashfreeService.createVendorAccount({
      email: restaurant.email,
      phone: restaurant.phone,
      name: restaurant.name,
      restaurantId: restaurant.id,
      bankAccount: restaurant.paymentAccounts?.bankAccount || null,
    });

    // Save vendor ID to restaurant record
    await restaurant.update({
      cashfreeVendorId: vendorId,
    });

    console.log(`[PAYMENT] ✓ Vendor account created and saved: ${vendorId}`);

    res.json({
      success: true,
      vendorId: vendorId,
      message: 'Vendor account created successfully',
    });

  } catch (error) {
    console.error('[PAYMENT] Vendor creation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create vendor account',
    });
  }
};

/**
 * Initiate payment for an order
 * Creates Cashfree order with automatic split settlement
 */
export const initiatePayment = async (req, res) => {
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
        message: 'Missing required fields: orderId, amount, restaurantId, customerPhone',
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

    // Ensure restaurant has vendor account
    let vendorId = restaurant.cashfreeVendorId;
    
    if (!vendorId) {
      console.log(`[PAYMENT] No vendor ID found, creating one for restaurant ${restaurant.id}`);
      
      // Auto-create vendor account
      vendorId = await cashfreeService.createVendorAccount({
        email: restaurant.email,
        phone: restaurant.phone,
        name: restaurant.name,
        restaurantId: restaurant.id,
        bankAccount: restaurant.paymentAccounts?.bankAccount || null,
      });

      // Save vendor ID
      await restaurant.update({ cashfreeVendorId: vendorId });
    }

    console.log(`[PAYMENT] Initiating payment for order ${orderId}`);
    console.log(`[PAYMENT] Restaurant: ${restaurant.name}, Amount: ₹${amount}`);
    console.log(`[PAYMENT] Vendor ID: ${vendorId}`);

    // Create Cashfree order with split settlement
    const paymentResponse = await cashfreeService.createOrder({
      orderId: orderId,
      amount: amount,
      vendorId: vendorId,
      customerPhone: customerPhone,
      customerName: customerName || 'Customer',
      customerEmail: customerEmail || null,
      restaurantName: restaurant.name,
    });

    // Update order with Cashfree order ID
    await Order.update(
      {
        transactionId: paymentResponse.orderId,
        paymentStatus: 'pending',
        paymentMethod: 'upi', // Default to UPI
      },
      {
        where: { id: orderId },
      }
    );

    console.log(`[PAYMENT] ✓ Payment initiated`);
    console.log(`[PAYMENT] Cashfree Order ID: ${paymentResponse.orderId}`);
    console.log(`[PAYMENT] Payment session: ${paymentResponse.sessionId}`);
    console.log(`[PAYMENT] Platform commission: ₹${paymentResponse.platformCommission}`);
    console.log(`[PAYMENT] Vendor amount: ₹${paymentResponse.vendorAmount}`);

    res.json({
      success: true,
      orderId: paymentResponse.orderId,
      sessionId: paymentResponse.sessionId,
      paymentLink: paymentResponse.paymentLink,
      amount: paymentResponse.amount,
      platformCommission: paymentResponse.platformCommission,
      vendorAmount: paymentResponse.vendorAmount,
      message: 'Payment initiated successfully',
    });

  } catch (error) {
    console.error('[PAYMENT] Payment initiation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to initiate payment',
    });
  }
};

/**
 * Cashfree webhook handler
 * Processes payment status updates, settlements, and vendor payouts
 * 
 * IMPORTANT: Webhook events handled:
 * 1. PAYMENT_SUCCESS_WEBHOOK - Payment completed successfully
 * 2. PAYMENT_FAILED_WEBHOOK - Payment failed
 * 3. SETTLEMENT_PROCESSED - Settlement completed (vendor gets money)
 * 
 * Settlement happens automatically based on vendor's schedule_option:
 * - schedule_option: 1 → T+1 settlement (money transferred next day)
 * - schedule_option: 2 → Instant settlement (if enabled in Cashfree dashboard)
 * 
 * No manual intervention needed - Cashfree handles settlement automatically
 */
export const handleWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-webhook-signature'];
    const payload = req.body;

    console.log(`[PAYMENT] Webhook received: ${payload.type}`);

    // Verify webhook signature for security
    if (!cashfreeService.verifyWebhookSignature(signature, payload)) {
      console.error('[PAYMENT] ⚠️  Invalid webhook signature');
      return res.status(401).json({
        success: false,
        message: 'Invalid signature',
      });
    }

    const { type, data } = payload;

    // Handle different webhook events
    switch (type) {
      case 'PAYMENT_SUCCESS_WEBHOOK':
        await handlePaymentSuccess(data);
        break;

      case 'PAYMENT_FAILED_WEBHOOK':
        await handlePaymentFailed(data);
        break;

      case 'SETTLEMENT_PROCESSED':
        await handleSettlementProcessed(data);
        break;

      case 'VENDOR_PAYOUT_UPDATE':
        await handleVendorPayoutUpdate(data);
        break;

      default:
        console.log(`[PAYMENT] Unhandled webhook type: ${type}`);
    }

    res.json({ success: true });

  } catch (error) {
    console.error('[PAYMENT] Webhook processing error:', error);
    res.status(500).json({ success: false });
  }
};

/**
 * Handle successful payment webhook
 */
async function handlePaymentSuccess(data) {
  try {
    const { order_id, payment_amount, cf_payment_id, payment_method } = data.order;

    console.log(`[PAYMENT] ✅ Payment successful: ${order_id}`);
    console.log(`[PAYMENT] Amount: ₹${payment_amount}, Method: ${payment_method}`);

    // Extract our internal order ID from Cashfree order ID
    // Format: CF_ORD_{orderId}_{timestamp}
    const orderIdMatch = order_id.match(/CF_ORD_(\d+)_/);
    
    if (!orderIdMatch) {
      console.error('[PAYMENT] Invalid order ID format');
      return;
    }

    const internalOrderId = orderIdMatch[1];

    // Update order status
    await Order.update(
      {
        paymentStatus: 'paid',
        status: 'preparing', // Move order to preparing after payment
        transactionId: cf_payment_id,
        paymentMethod: payment_method.toLowerCase(),
      },
      {
        where: { id: internalOrderId },
      }
    );

    console.log(`[PAYMENT] ✓ Order ${internalOrderId} marked as paid`);

    // Note: Settlement will happen automatically based on vendor's schedule_option
    // T+1 settlement: Money will be transferred to vendor's bank account next day
    // Instant settlement: Money transferred immediately (if enabled)
    // No manual intervention needed!

  } catch (error) {
    console.error('[PAYMENT] Error handling payment success:', error);
  }
}

/**
 * Handle failed payment webhook
 */
async function handlePaymentFailed(data) {
  try {
    const { order_id, payment_message } = data.order;

    console.log(`[PAYMENT] ❌ Payment failed: ${order_id}`);
    console.log(`[PAYMENT] Reason: ${payment_message}`);

    const orderIdMatch = order_id.match(/CF_ORD_(\d+)_/);
    
    if (!orderIdMatch) {
      console.error('[PAYMENT] Invalid order ID format');
      return;
    }

    const internalOrderId = orderIdMatch[1];

    // Update order status
    await Order.update(
      {
        paymentStatus: 'failed',
      },
      {
        where: { id: internalOrderId },
      }
    );

    console.log(`[PAYMENT] ✓ Order ${internalOrderId} marked as failed`);

  } catch (error) {
    console.error('[PAYMENT] Error handling payment failure:', error);
  }
}

/**
 * Handle settlement processed webhook
 * This webhook is triggered when money is settled to vendor's bank account
 * 
 * Settlement timing:
 * - Normal (T+1): Settlement happens next day after payment
 * - Instant: Settlement happens immediately (if enabled for merchant)
 * 
 * This is purely for logging/tracking - no action needed
 */
async function handleSettlementProcessed(data) {
  try {
    const { settlement_id, vendor_id, amount, settlement_date } = data;

    console.log(`[PAYMENT] 💰 Settlement processed for vendor: ${vendor_id}`);
    console.log(`[PAYMENT] Amount: ₹${amount}, Date: ${settlement_date}`);
    console.log(`[PAYMENT] Settlement ID: ${settlement_id}`);

    // Optional: Store settlement details in database for reconciliation
    // This can be used for generating settlement reports for restaurants

  } catch (error) {
    console.error('[PAYMENT] Error handling settlement:', error);
  }
}

/**
 * Handle vendor payout update webhook
 * Tracks when money is actually transferred to vendor's bank
 */
async function handleVendorPayoutUpdate(data) {
  try {
    const { vendor_id, payout_amount, payout_status, utr } = data;

    console.log(`[PAYMENT] 🏦 Vendor payout update: ${vendor_id}`);
    console.log(`[PAYMENT] Amount: ₹${payout_amount}, Status: ${payout_status}`);
    console.log(`[PAYMENT] UTR: ${utr}`);

    // Optional: Update restaurant records with payout information
    // Can be used to show payout history to restaurant owners

  } catch (error) {
    console.error('[PAYMENT] Error handling payout update:', error);
  }
}

/**
 * Check payment status
 * Can be polled by frontend to check payment completion
 */
export const checkPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required',
      });
    }

    console.log(`[PAYMENT] Checking status for Cashfree order: ${orderId}`);

    const statusResponse = await cashfreeService.getOrderStatus(orderId);

    res.json({
      success: true,
      status: statusResponse.status,
      orderId: statusResponse.orderId,
      amount: statusResponse.amount,
      paymentMethod: statusResponse.paymentMethod,
      transactionId: statusResponse.transactionId,
    });

  } catch (error) {
    console.error('[PAYMENT] Status check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check payment status',
    });
  }
};

/**
 * Initiate refund
 * Refunds are processed from main merchant account
 * Split vendors don't need to handle refunds
 */
export const initiateRefund = async (req, res) => {
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

    console.log(`[PAYMENT] Initiating refund for order ${orderId}, amount: ₹${amount}`);

    const refundResponse = await cashfreeService.initiateRefund({
      orderId: order.transactionId, // Use Cashfree order ID
      refundAmount: amount,
      refundNote: reason || 'Customer refund request',
    });

    // Update order status
    await order.update({
      paymentStatus: 'refunded',
    });

    console.log(`[PAYMENT] ✓ Refund initiated: ${refundResponse.refundId}`);

    res.json({
      success: true,
      refundId: refundResponse.refundId,
      status: refundResponse.status,
      message: 'Refund initiated successfully',
    });

  } catch (error) {
    console.error('[PAYMENT] Refund error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to initiate refund',
    });
  }
};

/**
 * Get vendor settlements
 * Shows settlement history for a restaurant
 */
export const getVendorSettlements = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { limit = 10 } = req.query;

    if (!restaurantId) {
      return res.status(400).json({
        success: false,
        message: 'Restaurant ID is required',
      });
    }

    // Get restaurant vendor ID
    const restaurant = await Restaurant.findByPk(restaurantId);
    
    if (!restaurant || !restaurant.cashfreeVendorId) {
      return res.status(404).json({
        success: false,
        message: 'Vendor account not found for this restaurant',
      });
    }

    console.log(`[PAYMENT] Fetching settlements for vendor: ${restaurant.cashfreeVendorId}`);

    const settlementsResponse = await cashfreeService.getVendorSettlements(
      restaurant.cashfreeVendorId,
      parseInt(limit)
    );

    res.json({
      success: true,
      vendorId: restaurant.cashfreeVendorId,
      settlements: settlementsResponse.settlements,
    });

  } catch (error) {
    console.error('[PAYMENT] Error fetching settlements:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch settlements',
    });
  }
};
