import PaymentAdapter from './PaymentAdapter.js';
import crypto from 'crypto';

class MockAdapter extends PaymentAdapter {
    constructor() {
        super();
        console.log('Payment Adapter: Mock Initialized');
    }

    async createOrder(amount, currency, receiptId) {
        const orderId = `order_mock_${crypto.randomBytes(4).toString('hex')}`;
        console.log(`[MockPayment] Created Order: ${orderId} for ${amount} ${currency}`);
        return {
            id: orderId,
            entity: 'order',
            amount: amount,
            amount_paid: 0,
            currency: currency,
            receipt: receiptId,
            status: 'created'
        };
    }

    async verifyPayment(paymentDetails) {
        // Mock verification: Always succeed if mock_success is true
        // In real world, verify signature
        console.log('[MockPayment] Verifying:', paymentDetails);
        const { orderId, paymentId, success } = paymentDetails;

        if (success === 'false' || success === false) {
            return false;
        }

        return true;
    }
}

export default MockAdapter;
