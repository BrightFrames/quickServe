import axios from 'axios';
import crypto from 'crypto';

/**
 * Cashfree Payments Utility Module
 * Handles marketplace payments with split settlements and platform commission
 */

class CashfreeService {
  constructor() {
    // Cashfree API credentials from environment variables
    this.clientId = process.env.CASHFREE_CLIENT_ID;
    this.clientSecret = process.env.CASHFREE_CLIENT_SECRET;
    this.apiVersion = '2023-08-01';
    
    // Environment - 'sandbox' for testing, 'production' for live
    this.environment = process.env.CASHFREE_ENVIRONMENT || 'sandbox';
    
    // API URLs based on environment
    this.baseUrl = this.environment === 'production'
      ? 'https://api.cashfree.com/pg'
      : 'https://sandbox.cashfree.com/pg';
    
    // Platform commission percentage (1% as per requirements)
    this.platformCommissionRate = 0.01; // 1%
    
    console.log(`[CASHFREE] Initialized in ${this.environment} mode`);
  }

  /**
   * Get authorization headers for Cashfree API calls
   */
  getAuthHeaders() {
    return {
      'x-client-id': this.clientId,
      'x-client-secret': this.clientSecret,
      'x-api-version': this.apiVersion,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Create or get Cashfree vendor account for restaurant
   * This creates a linked account in Cashfree marketplace
   * 
   * @param {Object} restaurantData - Restaurant details
   * @param {string} restaurantData.email - Restaurant email
   * @param {string} restaurantData.phone - Restaurant phone
   * @param {string} restaurantData.name - Restaurant name
   * @param {string} restaurantData.restaurantId - Restaurant ID
   * @param {Object} restaurantData.bankAccount - Bank account details (optional)
   * @returns {Promise<string>} Cashfree vendor_id
   */
  async createVendorAccount(restaurantData) {
    try {
      const { email, phone, name, restaurantId, bankAccount } = restaurantData;

      console.log(`[CASHFREE] Creating vendor account for restaurant: ${name}`);

      const payload = {
        vendor_id: `VENDOR_${restaurantId}`, // Unique vendor ID
        status: 'ACTIVE',
        name: name,
        email: email,
        phone: phone.replace(/\D/g, ''), // Remove non-numeric characters
        verify_account: false, // Set to true for KYC verification in production
        
        // Dashboard access for vendor (optional)
        dashboard_access: true,
        
        // Settlement configuration
        // Normal settlement is T+1 (next day)
        // Instant settlement can be enabled if configured in Cashfree dashboard
        schedule_option: 1, // 1 = Normal settlement (T+1), 2 = Instant if enabled
      };

      // Add bank account if provided
      if (bankAccount && bankAccount.accountNumber) {
        payload.bank_account_number = bankAccount.accountNumber;
        payload.bank_ifsc = bankAccount.ifscCode;
        payload.bank_account_name = bankAccount.accountHolderName;
      }

      const response = await axios.post(
        `${this.baseUrl}/easy-split/vendors`,
        payload,
        { headers: this.getAuthHeaders() }
      );

      const vendorId = response.data.vendor_id;
      console.log(`[CASHFREE] ✓ Vendor account created: ${vendorId}`);

      return vendorId;

    } catch (error) {
      // If vendor already exists, return the vendor_id
      if (error.response?.data?.message?.includes('already exists')) {
        const vendorId = `VENDOR_${restaurantData.restaurantId}`;
        console.log(`[CASHFREE] Vendor already exists: ${vendorId}`);
        return vendorId;
      }

      console.error('[CASHFREE] Vendor creation error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to create vendor account');
    }
  }

  /**
   * Create payment order with split settlement
   * Platform takes 1% commission, rest goes to restaurant vendor
   * 
   * @param {Object} orderData - Order details
   * @param {string} orderData.orderId - Order ID
   * @param {number} orderData.amount - Total amount in INR
   * @param {string} orderData.vendorId - Restaurant's Cashfree vendor ID
   * @param {string} orderData.customerPhone - Customer phone number
   * @param {string} orderData.customerName - Customer name
   * @param {string} orderData.customerEmail - Customer email (optional)
   * @param {string} orderData.restaurantName - Restaurant name
   * @returns {Promise<Object>} Payment session details
   */
  async createOrder(orderData) {
    try {
      const {
        orderId,
        amount,
        vendorId,
        customerPhone,
        customerName,
        customerEmail,
        restaurantName,
      } = orderData;

      console.log(`[CASHFREE] Creating order ${orderId} for ₹${amount}`);

      // Calculate platform commission (1% of total)
      const platformCommission = Math.round(amount * this.platformCommissionRate * 100) / 100;
      const vendorAmount = Math.round((amount - platformCommission) * 100) / 100;

      console.log(`[CASHFREE] Split: Platform ₹${platformCommission}, Vendor ₹${vendorAmount}`);

      // Prepare order payload
      const payload = {
        order_id: `CF_ORD_${orderId}_${Date.now()}`,
        order_amount: amount,
        order_currency: 'INR',
        customer_details: {
          customer_id: `CUST_${customerPhone}`,
          customer_name: customerName || 'Customer',
          customer_email: customerEmail || `customer${customerPhone}@quickserve.app`,
          customer_phone: customerPhone.replace(/\D/g, ''),
        },
        order_meta: {
          return_url: process.env.CASHFREE_RETURN_URL || `${process.env.FRONTEND_URL}/payment/callback`,
          notify_url: process.env.CASHFREE_WEBHOOK_URL || `${process.env.BACKEND_URL}/api/payment/cashfree/webhook`,
        },
        order_note: `Payment for ${restaurantName}`,
        
        // Terminal data - optional for UPI flow
        terminal_data: {
          payment_mode: 'UPI',
        },

        // IMPORTANT: Split settlement configuration
        // This is where the magic happens - automatic split between platform and vendor
        order_splits: [
          {
            // Vendor (Restaurant) gets their portion
            vendor_id: vendorId,
            amount: vendorAmount,
            // Settlement will happen automatically based on vendor's schedule_option:
            // - schedule_option: 1 → T+1 settlement (next day)
            // - schedule_option: 2 → Instant settlement (if enabled for merchant)
          },
          // Platform commission is automatically retained by the main merchant account
          // No need to explicitly define platform split - it's implicit
        ],
      };

      const response = await axios.post(
        `${this.baseUrl}/orders`,
        payload,
        { headers: this.getAuthHeaders() }
      );

      const { payment_session_id, order_id } = response.data;

      console.log(`[CASHFREE] ✓ Order created: ${order_id}`);
      console.log(`[CASHFREE] Payment session: ${payment_session_id}`);

      // Generate UPI payment link
      const paymentLink = `${this.baseUrl}/orders/${order_id}/pay`;

      return {
        success: true,
        orderId: order_id,
        sessionId: payment_session_id,
        paymentLink: paymentLink,
        amount: amount,
        platformCommission: platformCommission,
        vendorAmount: vendorAmount,
      };

    } catch (error) {
      console.error('[CASHFREE] Order creation error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to create payment order');
    }
  }

  /**
   * Verify payment signature from webhook
   * Cashfree sends signature in x-webhook-signature header
   * 
   * @param {string} signature - Signature from header
   * @param {Object} payload - Webhook payload
   * @returns {boolean} True if signature is valid
   */
  verifyWebhookSignature(signature, payload) {
    try {
      // Calculate signature using timestamp and raw body
      const timestamp = payload.timestamp || '';
      const rawBody = JSON.stringify(payload);
      
      const signatureData = timestamp + rawBody;
      const expectedSignature = crypto
        .createHmac('sha256', this.clientSecret)
        .update(signatureData)
        .digest('base64');

      const isValid = signature === expectedSignature;
      
      if (!isValid) {
        console.warn('[CASHFREE] ⚠️  Invalid webhook signature');
      }

      return isValid;

    } catch (error) {
      console.error('[CASHFREE] Signature verification error:', error);
      return false;
    }
  }

  /**
   * Get payment order status
   * 
   * @param {string} orderId - Cashfree order ID
   * @returns {Promise<Object>} Order status details
   */
  async getOrderStatus(orderId) {
    try {
      console.log(`[CASHFREE] Fetching status for order: ${orderId}`);

      const response = await axios.get(
        `${this.baseUrl}/orders/${orderId}`,
        { headers: this.getAuthHeaders() }
      );

      const orderStatus = response.data;
      
      console.log(`[CASHFREE] Order status: ${orderStatus.order_status}`);

      return {
        success: true,
        orderId: orderStatus.order_id,
        status: orderStatus.order_status, // ACTIVE, PAID, EXPIRED
        amount: orderStatus.order_amount,
        paymentMethod: orderStatus.payment_method,
        transactionId: orderStatus.cf_order_id,
      };

    } catch (error) {
      console.error('[CASHFREE] Status fetch error:', error.response?.data || error.message);
      throw new Error('Failed to fetch order status');
    }
  }

  /**
   * Get payment details by transaction ID
   * 
   * @param {string} orderId - Cashfree order ID
   * @param {string} transactionId - Payment transaction ID
   * @returns {Promise<Object>} Payment details
   */
  async getPaymentDetails(orderId, transactionId) {
    try {
      console.log(`[CASHFREE] Fetching payment details: ${transactionId}`);

      const response = await axios.get(
        `${this.baseUrl}/orders/${orderId}/payments/${transactionId}`,
        { headers: this.getAuthHeaders() }
      );

      return {
        success: true,
        payment: response.data,
      };

    } catch (error) {
      console.error('[CASHFREE] Payment details error:', error.response?.data || error.message);
      throw new Error('Failed to fetch payment details');
    }
  }

  /**
   * Initiate refund for a payment
   * Note: Refunds are processed from the main merchant account
   * Split vendors don't need to initiate refunds
   * 
   * @param {Object} refundData - Refund details
   * @param {string} refundData.orderId - Original Cashfree order ID
   * @param {string} refundData.refundAmount - Amount to refund
   * @param {string} refundData.refundNote - Reason for refund
   * @returns {Promise<Object>} Refund details
   */
  async initiateRefund(refundData) {
    try {
      const { orderId, refundAmount, refundNote } = refundData;

      console.log(`[CASHFREE] Initiating refund for order ${orderId}: ₹${refundAmount}`);

      const payload = {
        refund_amount: refundAmount,
        refund_id: `REFUND_${orderId}_${Date.now()}`,
        refund_note: refundNote || 'Customer refund request',
      };

      const response = await axios.post(
        `${this.baseUrl}/orders/${orderId}/refunds`,
        payload,
        { headers: this.getAuthHeaders() }
      );

      console.log(`[CASHFREE] ✓ Refund initiated: ${response.data.refund_id}`);

      return {
        success: true,
        refundId: response.data.refund_id,
        status: response.data.refund_status,
      };

    } catch (error) {
      console.error('[CASHFREE] Refund error:', error.response?.data || error.message);
      throw new Error('Failed to initiate refund');
    }
  }

  /**
   * Get settlement details for a vendor
   * 
   * @param {string} vendorId - Vendor ID
   * @param {number} limit - Number of settlements to fetch
   * @returns {Promise<Object>} Settlement details
   */
  async getVendorSettlements(vendorId, limit = 10) {
    try {
      console.log(`[CASHFREE] Fetching settlements for vendor: ${vendorId}`);

      const response = await axios.get(
        `${this.baseUrl}/easy-split/vendors/${vendorId}/settlements`,
        {
          headers: this.getAuthHeaders(),
          params: { limit },
        }
      );

      return {
        success: true,
        settlements: response.data,
      };

    } catch (error) {
      console.error('[CASHFREE] Settlement fetch error:', error.response?.data || error.message);
      throw new Error('Failed to fetch settlements');
    }
  }
}

// Export singleton instance
export default new CashfreeService();
