import express from 'express';
import * as paymentController from '../controllers/paymentController.js';

const router = express.Router();

/**
 * Cashfree Payment Routes
 * All endpoints for Cashfree marketplace payments with split settlements
 */

// ============================
// Vendor Management
// ============================

/**
 * POST /api/payment/cashfree/vendor/create
 * Create Cashfree vendor account for restaurant
 * Call this when restaurant registers or updates payment settings
 */
router.post('/cashfree/vendor/create', paymentController.createVendorAccount);

/**
 * GET /api/payment/cashfree/vendor/:restaurantId/settlements
 * Get settlement history for a restaurant vendor
 */
router.get('/cashfree/vendor/:restaurantId/settlements', paymentController.getVendorSettlements);

// ============================
// Payment Operations
// ============================

/**
 * POST /api/payment/cashfree/initiate
 * Initiate Cashfree payment with automatic split settlement
 * 
 * Body:
 * {
 *   orderId: number,
 *   amount: number,
 *   restaurantId: number,
 *   customerPhone: string,
 *   customerName: string (optional),
 *   customerEmail: string (optional)
 * }
 */
router.post('/cashfree/initiate', paymentController.initiatePayment);

/**
 * GET /api/payment/cashfree/status/:orderId
 * Check payment status for a Cashfree order
 * Can be polled by frontend to verify payment completion
 */
router.get('/cashfree/status/:orderId', paymentController.checkPaymentStatus);

/**
 * POST /api/payment/cashfree/refund
 * Initiate refund for a paid order
 * 
 * Body:
 * {
 *   orderId: number,
 *   amount: number,
 *   reason: string (optional)
 * }
 */
router.post('/cashfree/refund', paymentController.initiateRefund);

// ============================
// Webhooks
// ============================

/**
 * POST /api/payment/cashfree/webhook
 * Cashfree webhook endpoint for payment status updates
 * 
 * Handles:
 * - PAYMENT_SUCCESS_WEBHOOK
 * - PAYMENT_FAILED_WEBHOOK
 * - SETTLEMENT_PROCESSED
 * - VENDOR_PAYOUT_UPDATE
 * 
 * IMPORTANT: Configure this URL in Cashfree dashboard webhook settings
 */
router.post('/cashfree/webhook', paymentController.handleWebhook);

export default router;
