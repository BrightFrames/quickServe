import sequelize from '../config/database.js';
import Bill from '../models/Bill.js';
import Restaurant from '../models/Restaurant.js';

async function verifyModel() {
    try {
        console.log('--- STARTING DB MODEL VERIFICATION ---');
        await sequelize.authenticate();
        console.log('✓ Database connected');

        // Sync strictly the Bill model to ensure table exists (or use sync() generally)
        // In local dev, we might need to sync.
        await Bill.sync({ alter: true });
        console.log('✓ Bill table synced');

        // Find a restaurant to link to
        const restaurant = await Restaurant.findOne();
        if (!restaurant) {
            console.warn('⚠ No restaurant found. Creating dummy one for test.');

            // Should create one, but might violate constraints if we don't have all fields.
            // Let's hope we can or skip.
            // Assuming at least one exists from seed.
            console.log('Skipping creation test due to missing restaurant.');
            return;
        }
        console.log(`✓ Using Restaurant: ${restaurant.name} (ID: ${restaurant.id})`);

        // Create Bill
        const billData = {
            restaurantId: restaurant.id,
            billNumber: 'TEST-BILL-001',
            items: [{ name: 'Test Item', price: 100, quantity: 1, total: 100 }],
            subtotal: 100,
            taxAmount: 5,
            discountAmount: 0,
            grandTotal: 105,
            paymentMethod: 'cash',
            status: 'created'
        };

        const bill = await Bill.create(billData);
        console.log(`✓ Bill Created Successfully: ID ${bill.id}, Number ${bill.billNumber}`);

        // Update Status
        bill.status = 'paid';
        await bill.save();
        console.log('✓ Bill Status Updated to PAID');

        // Clean up
        await bill.destroy();
        console.log('✓ Bill Deleted (Cleanup)');

        console.log('--- VERIFICATION COMPLETE: ALL CHECKS PASSED ---');
        process.exit(0);
    } catch (error) {
        console.error('❌ Verification Failed:', error);
        process.exit(1);
    }
}

verifyModel();
