import MockAdapter from './MockAdapter.js';
// import RazorpayAdapter from './RazorpayAdapter.js'; // Future

const createPaymentAdapter = (gateway = 'mock') => {
    switch (gateway.toLowerCase()) {
        case 'razorpay':
            // return new RazorpayAdapter();
            throw new Error('Razorpay not configured yet, use mock');
        case 'mock':
        default:
            return new MockAdapter();
    }
};

export default createPaymentAdapter;
