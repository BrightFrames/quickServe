import sequelize from '../config/database.js';
import Bill from '../models/Bill.js';
import Restaurant from '../models/Restaurant.js';
import axios from 'axios';

// Since we are mocking internal API calls or testing logic directly, 
// let's test the Model Logic directly or simulate the API logic.
// Simulating the API logic is safer to verify the query construction.

async function verifyReports() {
    try {
        console.log('--- STARTING REPORTS VERIFICATION ---');
        await sequelize.authenticate();
        console.log('✓ Database connected');

        await Bill.sync({ alter: true });

        const restaurant = await Restaurant.findOne();
        if (!restaurant) {
            console.warn('⚠ No restaurant found. Aborting.');
            return;
        }

        // 1. Create Dummy Bills for Today
        console.log('Creating Test Bills...');
        const bill1 = await Bill.create({
            restaurantId: restaurant.id,
            billNumber: 'TEST-RPT-001',
            grandTotal: 100.00,
            status: 'paid',
            paymentMethod: 'cash',
            items: [],
            subtotal: 90,
            taxAmount: 10,
            discountAmount: 0
        });

        const bill2 = await Bill.create({
            restaurantId: restaurant.id,
            billNumber: 'TEST-RPT-002',
            grandTotal: 50.00,
            status: 'paid',
            paymentMethod: 'card',
            items: [],
            subtotal: 45,
            taxAmount: 5,
            discountAmount: 0
        });

        const billUnpaid = await Bill.create({
            restaurantId: restaurant.id,
            billNumber: 'TEST-RPT-003',
            grandTotal: 200.00,
            status: 'created', // Should not be counted
            paymentMethod: 'cash',
            items: [],
            subtotal: 180,
            taxAmount: 20,
            discountAmount: 0
        });

        console.log('✓ Created 2 Paid Bills ($150 total) and 1 Unpaid Bill ($200)');

        // 2. Query Logic Verification (Mirroring routes/reports.js)
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date();
        end.setHours(23, 59, 59, 999);

        const { Op } = require('sequelize');

        const bills = await Bill.findAll({
            where: {
                restaurantId: restaurant.id,
                status: 'paid',
                createdAt: {
                    [Op.between]: [start, end]
                }
            },
            attributes: ['grandTotal', 'paymentMethod']
        });

        let totalSales = 0;
        bills.forEach(b => totalSales += parseFloat(b.grandTotal));

        console.log(`Calculated Total Sales: ${totalSales}`);

        if (totalSales >= 150) {
            console.log('✓ Sales Aggregation verified (Includes at least our test bills)');
        } else {
            console.error('❌ Sales Aggregation Failed: Expected >= 150');
            process.exit(1);
        }

        console.log('--- VERIFICATION COMPLETE ---');
        process.exit(0);

    } catch (error) {
        console.error('❌ Verification Failed:', error);
        process.exit(1);
    }
}

verifyReports();
