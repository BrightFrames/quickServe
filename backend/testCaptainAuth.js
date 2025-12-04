import axios from 'axios';

const RENDER_URL = 'https://quickserve-51ek.onrender.com';

async function testCaptainAuth() {
  try {
    // First login as captain to get token
    console.log('1. Logging in as captain...');
    const loginResponse = await axios.post(`${RENDER_URL}/api/auth/captain/login`, {
      username: 'captain1',
      password: 'captain123'
    });
    
    console.log('✅ Login successful');
    console.log('Token:', loginResponse.data.token?.substring(0, 20) + '...');
    console.log('User:', loginResponse.data.user);
    
    const token = loginResponse.data.token;
    const restaurantSlug = loginResponse.data.user.restaurantSlug || 'vivek-singh-bhadoriya';
    
    // Now try to access tables
    console.log(`\n2. Fetching tables for restaurant: ${restaurantSlug}`);
    const tablesResponse = await axios.get(
      `${RENDER_URL}/api/captain/tables/${restaurantSlug}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    console.log('✅ Tables fetched successfully');
    console.log('Tables:', tablesResponse.data);
    
  } catch (error) {
    if (error.response) {
      console.error('❌ Error:', error.response.status, error.response.statusText);
      console.error('Message:', error.response.data);
    } else {
      console.error('❌ Network error:', error.message);
    }
  }
}

testCaptainAuth();
