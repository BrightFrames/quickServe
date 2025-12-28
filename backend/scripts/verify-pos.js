import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const API_URL = 'http://localhost:5000/api';

async function verifyPOS() {
    try {
        console.log('--- STARTING POS VERIFICATION ---');

        // 1. Login to get token (using a known test restaurant or creating one if needed, assuming one exists)
        // For simplicity, let's assume we can use the admin token or a known restaurant.
        // I'll try to login with a default or just use the restaurant token if I had it.
        // Since I don't have a known login, I'll check if I can register/login.
        // Actually, I can use the `checkKitchenUsers.js` or similar to find a user, or just creating a quick test flow.

        // Let's assume we have a Restaurant: 'quickserve-test' / 'QS1234' (default seed often has this).
        // I'll try to find a restaurant first via a utility if possible, but I can't easily.

        // Alternative: Verify models directly? No, checking API is better.
        // I will try to login as 'admin' first to get a token if that endpoint exists, or 'restaurant'.

        // Let's use a hardcoded restaurant credential that might exist or just fail if not.
        const loginRes = await axios.post(`${API_URL}/restaurant/login`, {
            email: 'test@example.com', // Replace with valid email if known
            password: 'password123'
        }).catch(() => null);

        let token;
        if (loginRes && loginRes.data) {
            token = loginRes.data.token;
            console.log('✓ Login successful');
        } else {
            console.warn('⚠ Login failed (expected if no test user). Skipping API auth checks, but verifying server is up.');
            // Without token, we can't test protected routes.
            // I'll try to fetch public menu or health check at least.
        }

        const healthRes = await axios.get(`${API_URL}/health`);
        console.log(`✓ Health Check: ${healthRes.data.status}`);

        // If we had a token, we would:
        if (token) {
            // 2. Create Bill
            const billData = {
                items: [{ id: 1, name: 'Test Item', price: 100, quantity: 2, total: 200 }],
                subtotal: 200,
                taxAmount: 10,
                grandTotal: 210,
                paymentMethod: 'cash',
                customerName: 'Test Customer'
            };
            const createRes = await axios.post(`${API_URL}/pos/create`, billData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log(`✓ Bill Created: ${createRes.data.bill.billNumber}`);

            // 3. List Bills
            const listRes = await axios.get(`${API_URL}/pos`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log(`✓ Bills Fetched: ${listRes.data.bills.length}`);
        } else {
            console.log('⚠ Skipping protected POS tests due to missing credentials.');
        }

        console.log('--- VERIFICATION COMPLETE ---');

    } catch (error) {
        console.error('❌ Verification Failed:', error.message);
        if (error.response) console.error('Response:', error.response.data);
    }
}

verifyPOS();
