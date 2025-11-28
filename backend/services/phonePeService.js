import crypto from 'crypto';
import axios from 'axios';

class PhonePeService {
  constructor() {
    this.merchantId = process.env.PHONEPE_MERCHANT_ID || 'MERCHANTUAT';
    this.saltKey = process.env.PHONEPE_SALT_KEY || '099eb0cd-02cf-4e2a-8aca-3e6c6aff0399';
    this.saltIndex = process.env.PHONEPE_SALT_INDEX || '1';
    this.apiUrl = process.env.PHONEPE_API_URL || 'https://api-preprod.phonepe.com/apis/pg-sandbox';
    this.redirectUrl = process.env.PHONEPE_REDIRECT_URL || 'http://localhost:8080/payment/callback';
    this.callbackUrl = process.env.PHONEPE_CALLBACK_URL || 'http://localhost:3000/api/payment/phonepe/callback';
  }

  /**
   * Generate SHA256 hash for PhonePe API authentication
   */
  generateHash(payload) {
    const string = payload + '/pg/v1/pay' + this.saltKey;
    const sha256 = crypto.createHash('sha256').update(string).digest('hex');
    return sha256 + '###' + this.saltIndex;
  }

  /**
   * Generate hash for status check
   */
  generateStatusHash(merchantTransactionId) {
    const string = `/pg/v1/status/${this.merchantId}/${merchantTransactionId}` + this.saltKey;
    const sha256 = crypto.createHash('sha256').update(string).digest('hex');
    return sha256 + '###' + this.saltIndex;
  }

  /**
   * Initiate payment for a restaurant order
   * @param {Object} paymentData - Payment details
   * @param {string} paymentData.orderId - Unique order ID
   * @param {number} paymentData.amount - Amount in rupees
   * @param {string} paymentData.restaurantMerchantId - Restaurant's PhonePe merchant ID
   * @param {string} paymentData.customerPhone - Customer mobile number
   * @param {string} paymentData.customerName - Customer name
   * @param {number} paymentData.platformFee - Platform commission (optional)
   */
  async initiatePayment(paymentData) {
    try {
      const {
        orderId,
        amount,
        restaurantMerchantId,
        customerPhone,
        customerName = 'Customer',
        platformFee = 0,
      } = paymentData;

      // PhonePe requires amount in paise (smallest currency unit)
      const amountInPaise = Math.round(amount * 100);
      const merchantTransactionId = `TXN_${orderId}_${Date.now()}`;

      // Payment request payload
      const paymentPayload = {
        merchantId: this.merchantId,
        merchantTransactionId: merchantTransactionId,
        merchantUserId: `USER_${customerPhone}`,
        amount: amountInPaise,
        redirectUrl: `${this.redirectUrl}?orderId=${orderId}`,
        redirectMode: 'POST',
        callbackUrl: this.callbackUrl,
        mobileNumber: customerPhone,
        paymentInstrument: {
          type: 'PAY_PAGE', // Shows all payment options (UPI, Card, NetBanking, Wallet)
        },
      };

      // Add split payment if restaurant has separate merchant ID
      if (restaurantMerchantId && restaurantMerchantId !== this.merchantId) {
        const restaurantAmount = amountInPaise - (platformFee * 100);
        
        paymentPayload.paymentInstrument.splitPayments = [
          {
            merchantId: restaurantMerchantId,
            amount: restaurantAmount,
            split: 'BY_AMOUNT',
          },
        ];
      }

      // Convert payload to base64
      const base64Payload = Buffer.from(JSON.stringify(paymentPayload)).toString('base64');

      // Generate X-VERIFY header
      const xVerify = this.generateHash(base64Payload);

      // Make API request
      const response = await axios.post(
        `${this.apiUrl}/pg/v1/pay`,
        {
          request: base64Payload,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-VERIFY': xVerify,
          },
        }
      );

      if (response.data.success) {
        return {
          success: true,
          transactionId: merchantTransactionId,
          paymentUrl: response.data.data.instrumentResponse.redirectInfo.url,
          data: response.data.data,
        };
      } else {
        throw new Error(response.data.message || 'Payment initiation failed');
      }
    } catch (error) {
      console.error('PhonePe payment initiation error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to initiate payment');
    }
  }

  /**
   * Check payment status
   */
  async checkPaymentStatus(merchantTransactionId) {
    try {
      const xVerify = this.generateStatusHash(merchantTransactionId);

      const response = await axios.get(
        `${this.apiUrl}/pg/v1/status/${this.merchantId}/${merchantTransactionId}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-VERIFY': xVerify,
            'X-MERCHANT-ID': this.merchantId,
          },
        }
      );

      return {
        success: response.data.success,
        code: response.data.code,
        message: response.data.message,
        data: response.data.data,
      };
    } catch (error) {
      console.error('PhonePe status check error:', error.response?.data || error.message);
      throw new Error('Failed to check payment status');
    }
  }

  /**
   * Verify webhook callback signature
   */
  verifyWebhookSignature(receivedSignature, payload) {
    const expectedSignature = crypto
      .createHash('sha256')
      .update(payload + this.saltKey)
      .digest('hex');
    
    return receivedSignature === expectedSignature + '###' + this.saltIndex;
  }

  /**
   * Initiate refund
   */
  async initiateRefund(refundData) {
    try {
      const {
        originalTransactionId,
        orderId,
        amount,
      } = refundData;

      const amountInPaise = Math.round(amount * 100);
      const merchantTransactionId = `REFUND_${orderId}_${Date.now()}`;

      const refundPayload = {
        merchantId: this.merchantId,
        merchantTransactionId: merchantTransactionId,
        originalTransactionId: originalTransactionId,
        amount: amountInPaise,
        callbackUrl: this.callbackUrl,
      };

      const base64Payload = Buffer.from(JSON.stringify(refundPayload)).toString('base64');
      const xVerify = this.generateHash(base64Payload);

      const response = await axios.post(
        `${this.apiUrl}/pg/v1/refund`,
        {
          request: base64Payload,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-VERIFY': xVerify,
          },
        }
      );

      return {
        success: response.data.success,
        transactionId: merchantTransactionId,
        data: response.data.data,
      };
    } catch (error) {
      console.error('PhonePe refund error:', error.response?.data || error.message);
      throw new Error('Failed to initiate refund');
    }
  }

  /**
   * Generate UPI QR code for restaurant
   */
  async generateQRCode(qrData) {
    try {
      const {
        orderId,
        amount,
        restaurantMerchantId,
      } = qrData;

      const amountInPaise = Math.round(amount * 100);
      const merchantTransactionId = `QR_${orderId}_${Date.now()}`;

      const qrPayload = {
        merchantId: restaurantMerchantId || this.merchantId,
        merchantTransactionId: merchantTransactionId,
        amount: amountInPaise,
        expiresIn: 300, // 5 minutes
      };

      const base64Payload = Buffer.from(JSON.stringify(qrPayload)).toString('base64');
      const xVerify = this.generateHash(base64Payload);

      const response = await axios.post(
        `${this.apiUrl}/pg/v1/qr`,
        {
          request: base64Payload,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-VERIFY': xVerify,
          },
        }
      );

      return {
        success: response.data.success,
        qrString: response.data.data.qrData,
        transactionId: merchantTransactionId,
      };
    } catch (error) {
      console.error('PhonePe QR generation error:', error.response?.data || error.message);
      throw new Error('Failed to generate QR code');
    }
  }
}

export default new PhonePeService();
