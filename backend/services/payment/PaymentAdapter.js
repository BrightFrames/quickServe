/**
 * Payment Adapter Interface
 * All payment providers must implement these methods.
 */
class PaymentAdapter {
    /**
     * Initialize a payment order/intent
     * @param {number} amount - Amount in smallest currency unit (e.g. paise for INR)
     * @param {string} currency - Currency code (INR, USD)
     * @param {object} receiptId - Internal Bill ID or Reference
     * @returns {Promise<object>} - { orderId, amount, currency, ...providerSpecifics }
     */
    async createOrder(amount, currency, receiptId) {
        throw new Error('createOrder not implemented');
    }

    /**
     * Verify a payment signature/status
     * @param {object} paymentDetails - Provider specific verification payload
     * @returns {Promise<boolean>} - True if valid
     */
    async verifyPayment(paymentDetails) {
        throw new Error('verifyPayment not implemented');
    }
}

export default PaymentAdapter;
