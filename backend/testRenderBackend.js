// Test script to check if Render backend is working
const axios = require('axios');

const RENDER_URL = 'https://quickserve-51ek.onrender.com';

async function testRenderBackend() {
  console.log('Testing Render backend...\n');
  
  // Test 1: Health check
  try {
    console.log('1. Testing root endpoint...');
    const healthCheck = await axios.get(`${RENDER_URL}/`);
    console.log('✅ Root endpoint working:', healthCheck.status);
  } catch (error) {
    console.log('❌ Root endpoint failed:', error.message);
  }
  
  // Test 2: Check restaurant routes
  try {
    console.log('\n2. Testing /api/restaurant endpoint...');
    const restaurantCheck = await axios.get(`${RENDER_URL}/api/restaurant`);
    console.log('✅ Restaurant endpoint:', restaurantCheck.status);
  } catch (error) {
    console.log('❌ Restaurant endpoint:', error.response?.status || error.message);
  }
  
  // Test 3: Check verify-admin-password
  try {
    console.log('\n3. Testing /api/restaurant/verify-admin-password...');
    const verifyCheck = await axios.post(`${RENDER_URL}/api/restaurant/verify-admin-password`, {
      slug: 'test',
      password: 'test'
    });
    console.log('✅ Verify endpoint working');
  } catch (error) {
    if (error.response) {
      console.log('⚠️ Verify endpoint responded with:', error.response.status, error.response.statusText);
      if (error.response.status === 404) {
        console.log('❌ 404 - Route not found on Render backend!');
      } else {
        console.log('✅ Route exists (non-404 response)');
      }
    } else {
      console.log('❌ Network error:', error.message);
    }
  }
  
  console.log('\n=== Test Complete ===');
}

testRenderBackend();
