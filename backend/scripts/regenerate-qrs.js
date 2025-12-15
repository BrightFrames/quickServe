
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import QRCode from 'qrcode';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '../database.sqlite');

// Config
const BASE_URL = process.env.CUSTOMER_APP_URL || "http://localhost:8080";

async function regenerateQRCodes() {
    console.log('🔄 Starting QR Code Regeneration...');
    console.log(`📂 Database: ${dbPath}`);
    console.log(`🔗 Base URL: ${BASE_URL}`);

    try {
        const db = await open({
            filename: dbPath,
            driver: sqlite3.Database
        });

        // Get all tables
        const tables = await db.all('SELECT * FROM Tables');
        console.log(`📊 Found ${tables.length} tables to process.`);

        let updatedCount = 0;

        for (const table of tables) {
            // Logic for new URL
            // Rule: /menu/{restaurantId}?table={tableId}
            const restaurantId = table.restaurantId;
            const tableId = table.tableId;

            const orderUrl = `${BASE_URL}/menu/${restaurantId}?table=${tableId}`;

            console.log(`[Table ${table.id}] Generating QR for: ${orderUrl}`);

            // Generate QR Image
            const qrCodeImage = await QRCode.toDataURL(orderUrl, {
                errorCorrectionLevel: "H",
                type: "image/png",
                width: 300,
                margin: 2,
            });

            // Update DB
            await db.run('UPDATE Tables SET qrCode = ? WHERE id = ?', [qrCodeImage, table.id]);
            updatedCount++;
        }

        console.log(`✅ Successfully regenerated ${updatedCount} QR codes.`);
        await db.close();

    } catch (error) {
        console.error('❌ Error regenerating QR codes:', error);
    }
}

regenerateQRCodes();
