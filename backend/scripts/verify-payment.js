import sequelize from '../config/database.js';
import Bill from '../models/Bill.js';
import Restaurant from '../models/Restaurant.js';
import createPaymentAdapter from '../services/payment/factory.js';

async function verifyPaymentFlow() {
    try {
        console.log('--- STARTING PAYMENT VERIFICATION ---');
        await sequelize.authenticate();
        console.log('✓ Database connected');

        await Bill.sync({ alter: true });

        const restaurant = await Restaurant.findOne();
        if (!restaurant) {
            console.warn('⚠ No restaurant found. Aborting.');
            return;
        }

        // 1. Create a Test Bill
        console.log('Creating Test Bill...');
        const bill = await Bill.create({
            restaurantId: restaurant.id,
            billNumber: 'TEST-PAY-001',
            grandTotal: 500.00,
            status: 'created',
            paymentMethod: 'cash', // Initial state
            items: [],
            subtotal: 500,
            taxAmount: 0,
            discountAmount: 0
        });
        console.log(`✓ Created Bill ID: ${bill.id}`);

        // 2. Initiate Payment (Simulating Route Logic)
        console.log('Initiating Mock Payment...');
        const adapter = createPaymentAdapter('mock');
        const amount = Math.round(parseFloat(bill.grandTotal) * 100);
        const orderData = await adapter.createOrder(amount, 'INR', bill.billNumber);

        console.log(`✓ Order Created: ${orderData.id}`);

        // 3. Verify Payment/Simulate Callback
        console.log('Verifying Mock Payment...');
        const paymentDetails = {
            orderId: orderData.id,
            paymentId: 'pay_mock_12345',
            success: true
        };

        const isValid = await adapter.verifyPayment(paymentDetails);
        if (isValid) {
            bill.status = 'paid';
            bill.paymentMethod = 'card';
            bill.transactionId = paymentDetails.paymentId;
            bill.gateway = 'mock';
            bill.gatewayResponse = paymentDetails;
            await bill.save();
            console.log('✓ Payment Verified and Bill Updated to PAID');
        } else {
            console.error('❌ Payment Verification Failed');
            process.exit(1);
        }

        // 4. Double Check Database
        const updatedBill = await Bill.findByPk(bill.id);
        if (updatedBill.status === 'paid' && updatedBill.gateway === 'mock') {
            console.log('✓ Database Persisted Correctly');
        } else {
            console.error('❌ Database Persistence Failed');
            process.exit(1);
        }

        console.log('--- VERIFICATION COMPLETE ---');
        process.exit(0);

    } catch (error) {
        console.error('❌ Verification Failed:', error);
        process.exit(1);
    }
}

verifyPaymentFlow();
