
import QRCode from 'qrcode';
import sequelize from '../config/database.js';
import Table from '../models/Table.js';
import Restaurant from '../models/Restaurant.js'; // Needed if we want to log names, or just for association safety

// Config
const BASE_URL = process.env.CUSTOMER_APP_URL || "http://localhost:8080";

async function regenerateQRCodes() {
    console.log('🔄 Starting QR Code Regeneration (Sequelize/Postgres)...');
    console.log(`🔗 Base URL: ${BASE_URL}`);

    try {
        await sequelize.authenticate();
        console.log('✅ Database connected.');

        // Fetch all tables
        const tables = await Table.findAll();
        console.log(`📊 Found ${tables.length} tables to process.`);

        let updatedCount = 0;

        for (const table of tables) {
            // Logic for new URL
            // Rule: /menu/{restaurantId}?table={tableId}
            const restaurantId = table.restaurantId;
            const tableId = table.tableId;

            const orderUrl = `${BASE_URL}/menu/${restaurantId}?table=${tableId}`;

            // Generate QR Image
            const qrCodeImage = await QRCode.toDataURL(orderUrl, {
                errorCorrectionLevel: "H",
                type: "image/png",
                width: 300,
                margin: 2,
            });

            // Update DB using Sequelize
            await table.update({ qrCode: qrCodeImage });

            console.log(`[Table ${table.id}] Updated QR for: ${orderUrl}`);
            updatedCount++;
        }

        console.log(`✅ Successfully regenerated ${updatedCount} QR codes.`);

    } catch (error) {
        console.error('❌ Error regenerating QR codes:', error);
    } finally {
        await sequelize.close();
    }
}

regenerateQRCodes();
