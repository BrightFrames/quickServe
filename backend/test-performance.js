/**
 * Performance Testing & Verification Script
 * Run this to verify performance optimizations are working
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:3000/api';
const RESTAURANT_ID = 2; // Change to your test restaurant ID

console.log('🚀 QuickServe Performance Test\n');

// Test 1: Check compression
async function testCompression() {
  console.log('📦 Test 1: Response Compression');
  try {
    const response = await axios.get(`${BASE_URL}/menu`, {
      params: { restaurantId: RESTAURANT_ID },
      headers: {
        'Accept-Encoding': 'gzip, deflate'
      }
    });
    
    const isCompressed = response.headers['content-encoding']?.includes('gzip') || 
                        response.headers['content-encoding']?.includes('deflate');
    
    console.log(`   Compression: ${isCompressed ? '✅ Enabled' : '❌ Disabled'}`);
    console.log(`   Content-Encoding: ${response.headers['content-encoding'] || 'none'}`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  console.log('');
}

// Test 2: Check cache performance
async function testCachePerformance() {
  console.log('⚡ Test 2: Cache Performance');
  
  try {
    // First request (cold cache)
    const start1 = Date.now();
    await axios.get(`${BASE_URL}/menu`, {
      params: { restaurantId: RESTAURANT_ID }
    });
    const time1 = Date.now() - start1;
    
    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Second request (should hit cache)
    const start2 = Date.now();
    await axios.get(`${BASE_URL}/menu`, {
      params: { restaurantId: RESTAURANT_ID }
    });
    const time2 = Date.now() - start2;
    
    console.log(`   First request (cold cache): ${time1}ms`);
    console.log(`   Second request (cached): ${time2}ms`);
    console.log(`   Speed improvement: ${Math.round((1 - time2/time1) * 100)}%`);
    
    if (time2 < time1 / 2) {
      console.log('   ✅ Cache is working effectively!');
    } else {
      console.log('   ⚠️  Cache might not be working optimally');
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  console.log('');
}

// Test 3: Check ETag support
async function testETagSupport() {
  console.log('🏷️  Test 3: ETag Support');
  
  try {
    const response = await axios.get(`${BASE_URL}/restaurant/info/${RESTAURANT_ID}`);
    const etag = response.headers['etag'];
    
    console.log(`   ETag: ${etag ? '✅ Present' : '❌ Missing'}`);
    
    if (etag) {
      // Test conditional request
      try {
        await axios.get(`${BASE_URL}/restaurant/info/${RESTAURANT_ID}`, {
          headers: { 'If-None-Match': etag }
        });
        console.log('   ⚠️  Should have returned 304 Not Modified');
      } catch (error) {
        if (error.response?.status === 304) {
          console.log('   ✅ Conditional requests working (304 Not Modified)');
        }
      }
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  console.log('');
}

// Test 4: Check response times
async function testResponseTimes() {
  console.log('⏱️  Test 4: Response Time Analysis');
  
  const endpoints = [
    { name: 'Menu', url: `/menu?restaurantId=${RESTAURANT_ID}` },
    { name: 'Restaurant Info', url: `/restaurant/info/${RESTAURANT_ID}` },
  ];
  
  for (const endpoint of endpoints) {
    try {
      const times = [];
      
      // Run 5 requests
      for (let i = 0; i < 5; i++) {
        const start = Date.now();
        await axios.get(`${BASE_URL}${endpoint.url}`);
        times.push(Date.now() - start);
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      const avg = Math.round(times.reduce((a, b) => a + b) / times.length);
      const min = Math.min(...times);
      const max = Math.max(...times);
      
      console.log(`   ${endpoint.name}:`);
      console.log(`      Average: ${avg}ms`);
      console.log(`      Min: ${min}ms | Max: ${max}ms`);
      
      if (avg < 100) {
        console.log(`      ✅ Excellent performance`);
      } else if (avg < 300) {
        console.log(`      ⚠️  Good performance`);
      } else {
        console.log(`      ❌ Needs optimization`);
      }
    } catch (error) {
      console.log(`   ❌ ${endpoint.name} - Error: ${error.message}`);
    }
  }
  console.log('');
}

// Run all tests
async function runTests() {
  console.log('Starting performance tests...\n');
  console.log('Make sure the backend server is running on http://localhost:3000\n');
  
  await testCompression();
  await testCachePerformance();
  await testETagSupport();
  await testResponseTimes();
  
  console.log('✅ All tests completed!\n');
  console.log('Check backend logs for cache HIT/MISS messages:');
  console.log('   grep "[CACHE]" backend/logs/*.log\n');
}

// Execute
runTests().catch(console.error);
