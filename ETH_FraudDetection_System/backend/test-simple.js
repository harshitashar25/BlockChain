/**
 * Simple Test Script - Quick Wallet Tracking Test
 * 
 * This script quickly:
 * 1. Adds wallets to track
 * 2. Creates a few test transactions
 * 
 * Usage: node test-simple.js
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000';

async function quickTest() {
  console.log('\n🚀 Quick Wallet Tracking Test\n');

  try {
    // Add wallets
    console.log('📝 Adding wallets to track...');
    await axios.post(`${API_BASE_URL}/api/track/address`, {
      address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
    });
    console.log('  ✅ Added wallet 1');

    await axios.post(`${API_BASE_URL}/api/track/address`, {
      address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb'
    });
    console.log('  ✅ Added wallet 2');

    // Create transactions
    console.log('\n💸 Creating test transactions...');
    
    await axios.post(`${API_BASE_URL}/api/transactions/test`, {
      type: 'eth',
      value: '1.5'
    });
    console.log('  ✅ Created ETH transaction 1');

    await axios.post(`${API_BASE_URL}/api/transactions/test`, {
      type: 'eth',
      value: '2.0'
    });
    console.log('  ✅ Created ETH transaction 2');

    await axios.post(`${API_BASE_URL}/api/transactions/test`, {
      type: 'token'
    });
    console.log('  ✅ Created Token transaction');

    console.log('\n✅ Test complete! Check your dashboard at http://localhost:3001\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('   Make sure the backend server is running: npm start\n');
    }
    process.exit(1);
  }
}

quickTest();

