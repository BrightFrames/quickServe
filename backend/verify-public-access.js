
import axios from 'axios';

const PORTS = [3000, 5000];

async function checkPort(port) {
    const BASE_URL = `http://localhost:${port}`;
    console.log(`\nChecking Port ${port}...`);
    try {
        // Just a health check or root check to see if server is there
        await axios.get(`${BASE_URL}/api/health`, { timeout: 2000 });
        console.log(`✅ Server found on port ${port}`);
        return BASE_URL;
    } catch (e) {
        // console.log(`   No server on ${port} or health check failed.`);
        return null;
    }
}

async function runVerification() {
    console.log('Starting Public Menu API Verification...');

    let baseUrl = null;
    for (const port of PORTS) {
        baseUrl = await checkPort(port);
        if (baseUrl) break;
    }

    if (!baseUrl) {
        console.error('❌ Could not find running server on port 3000 or 5000.');
        console.log('   Please ensure the backend server is running.');
        process.exit(1);
    }

    const knownId = 1;

    console.log(`\nTest 1: Fetching Menu by ID: ${knownId} at ${baseUrl}/public/menu/${knownId}`);
    try {
        const resId = await axios.get(`${baseUrl}/public/menu/${knownId}`);
        console.log(`✅ Success! Status: ${resId.status}`);
        console.log(`   Restaurant Name: ${resId.data.restaurant.name}`);
        console.log(`   Menu Items: length ${resId.data.menu?.length}`);

        if (parseInt(resId.data.restaurant.id) !== knownId) {
            console.error(`❌ Mismatch! Requested ID ${knownId} but got ${resId.data.restaurant.id}`);
        } else {
            console.log('   ID Match confirmed.');
        }
    } catch (e) {
        console.log(`⚠️ Failed to fetch by ID ${knownId}.`);
        if (e.response) {
            console.log(`   Status: ${e.response.status} - ${e.response.statusText}`);
            console.log(`   Data:`, e.response.data);
        } else {
            console.log(`   Error: ${e.message}`);
        }
    }

    // 2. Fetch by Slug
    const knownSlug = 'bites-delight'; // We might need to adjust this if verification fails
    console.log(`\nTest 2: Fetching Menu by Slug: ${knownSlug}`);
    try {
        const resSlug = await axios.get(`${baseUrl}/public/menu/${knownSlug}`);
        console.log(`✅ Success! Status: ${resSlug.status}`);
        console.log(`   Restaurant Name: ${resSlug.data.restaurant.name}`);
    } catch (e) {
        console.log(`⚠️ Failed to fetch by Slug ${knownSlug}.`);
        if (e.response) {
            console.log(`   Status: ${e.response.status}`);
        } else {
            console.log(`   Error: ${e.message}`);
        }
    }
}

runVerification();
