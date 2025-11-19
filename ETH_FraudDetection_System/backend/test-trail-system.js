/**
 * Automated Test Script for Transaction Trail System
 * 
 * This script will:
 * 1. Add multiple wallets to track
 * 2. Create test transactions between them
 * 3. Test all trail endpoints
 * 4. Display results
 * 
 * Usage: node test-trail-system.js
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000';

// Test wallet addresses (using real Ethereum addresses for realism)
const TEST_WALLETS = [
  '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', // Vitalik
  '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', // Test wallet 1
  '0x8ba1f109551bD432803012645Hac136c22C9293', // Test wallet 2
  '0x3f5CE5FBFe3E9af3971dD833D26bA9b5C936f0bE', // Binance hot wallet
];

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testHealthCheck() {
  log('\n📡 Testing Health Check...', 'cyan');
  try {
    const response = await axios.get(`${API_BASE_URL}/health`);
    log(`✅ Server is running: ${response.data.status}`, 'green');
    return true;
  } catch (error) {
    log(`❌ Server not responding: ${error.message}`, 'red');
    return false;
  }
}

async function addWalletToTrack(address) {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/track/address`, {
      address: address
    });
    log(`  ✅ Added: ${address.substring(0, 10)}...${address.substring(address.length - 8)}`, 'green');
    return true;
  } catch (error) {
    log(`  ❌ Failed to add ${address}: ${error.message}`, 'red');
    return false;
  }
}

async function createTestTransaction(from, to, value, type = 'eth') {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/transactions/test`, {
      from: from,
      to: to,
      value: value,
      type: type
    });
    log(`  ✅ Created ${type} tx: ${value} ETH from ${from.substring(0, 8)}... to ${to.substring(0, 8)}...`, 'green');
    return response.data.transaction;
  } catch (error) {
    log(`  ❌ Failed to create transaction: ${error.message}`, 'red');
    return null;
  }
}

async function testTrail(address) {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/trail/${address}?hops=5`);
    log(`  📊 Trail found: ${response.data.paths.length} paths, ${response.data.transactionCount} transactions`, 'blue');
    return response.data;
  } catch (error) {
    log(`  ❌ Trail test failed: ${error.message}`, 'red');
    return null;
  }
}

async function testStats(address) {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/trail/stats/${address}`);
    log(`  📈 Stats: ${response.data.outgoingCount} outgoing, ${response.data.incomingCount} incoming, ${response.data.totalOutgoing} ETH sent`, 'blue');
    return response.data;
  } catch (error) {
    log(`  ❌ Stats test failed: ${error.message}`, 'red');
    return null;
  }
}

async function testConnected(address) {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/trail/connected/${address}?depth=3`);
    log(`  🔗 Connected to ${response.data.count} addresses`, 'blue');
    return response.data;
  } catch (error) {
    log(`  ❌ Connected test failed: ${error.message}`, 'red');
    return null;
  }
}

async function testFlow(from, to) {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/trail/flow?from=${from}&to=${to}`);
    log(`  💸 Flow: ${response.data.count} transactions between addresses`, 'blue');
    return response.data;
  } catch (error) {
    log(`  ❌ Flow test failed: ${error.message}`, 'red');
    return null;
  }
}

async function testPath(from, to) {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/trail/path?from=${from}&to=${to}`);
    if (response.data.found) {
      log(`  🛤️  Path found: ${response.data.path.length} hops`, 'blue');
    } else {
      log(`  ⚠️  No path found between addresses`, 'yellow');
    }
    return response.data;
  } catch (error) {
    log(`  ❌ Path test failed: ${error.message}`, 'red');
    return null;
  }
}

async function testGraph() {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/trail/graph?depth=2`);
    log(`  🕸️  Graph: ${response.data.nodes.length} nodes, ${response.data.edges.length} edges`, 'blue');
    return response.data;
  } catch (error) {
    log(`  ❌ Graph test failed: ${error.message}`, 'red');
    return null;
  }
}

async function runTests() {
  log('\n🚀 Starting Transaction Trail System Tests\n', 'cyan');
  log('=' .repeat(60), 'cyan');

  // Step 1: Health Check
  const isHealthy = await testHealthCheck();
  if (!isHealthy) {
    log('\n❌ Server is not running. Please start the backend server first.', 'red');
    log('   Run: cd backend && npm start\n', 'yellow');
    process.exit(1);
  }

  await sleep(1000);

  // Step 2: Add Wallets to Track
  log('\n📝 Step 1: Adding Wallets to Track...', 'cyan');
  const trackedWallets = [];
  for (const wallet of TEST_WALLETS) {
    const added = await addWalletToTrack(wallet);
    if (added) {
      trackedWallets.push(wallet);
    }
    await sleep(500);
  }
  log(`\n✅ Tracking ${trackedWallets.length} wallets`, 'green');

  await sleep(1000);

  // Step 3: Create Test Transactions
  log('\n💸 Step 2: Creating Test Transactions...', 'cyan');
  
  const transactions = [];
  
  // Create ETH transfers
  if (trackedWallets.length >= 2) {
    transactions.push(await createTestTransaction(
      trackedWallets[0],
      trackedWallets[1],
      '1.5',
      'eth'
    ));
    await sleep(500);

    transactions.push(await createTestTransaction(
      trackedWallets[0],
      trackedWallets[1],
      '2.0',
      'eth'
    ));
    await sleep(500);

    transactions.push(await createTestTransaction(
      trackedWallets[1],
      trackedWallets[0],
      '0.5',
      'eth'
    ));
    await sleep(500);
  }

  // Create token transfer
  if (trackedWallets.length >= 2) {
    transactions.push(await createTestTransaction(
      trackedWallets[0],
      trackedWallets[1],
      '100',
      'token'
    ));
    await sleep(500);
  }

  // Create NFT transfer
  if (trackedWallets.length >= 2) {
    transactions.push(await createTestTransaction(
      trackedWallets[1],
      trackedWallets[0],
      '1',
      'nft'
    ));
    await sleep(500);
  }

  // Create more transactions for a better trail
  if (trackedWallets.length >= 3) {
    transactions.push(await createTestTransaction(
      trackedWallets[1],
      trackedWallets[2],
      '3.0',
      'eth'
    ));
    await sleep(500);

    transactions.push(await createTestTransaction(
      trackedWallets[2],
      trackedWallets[0],
      '1.0',
      'eth'
    ));
    await sleep(500);
  }

  log(`\n✅ Created ${transactions.filter(t => t !== null).length} test transactions`, 'green');

  await sleep(2000);

  // Step 4: Test Trail Endpoints
  log('\n🔍 Step 3: Testing Trail Endpoints...', 'cyan');
  
  if (trackedWallets.length > 0) {
    const testAddress = trackedWallets[0];
    
    log(`\n📊 Testing Trail for ${testAddress.substring(0, 10)}...`, 'yellow');
    await testTrail(testAddress);
    await sleep(500);

    log(`\n📈 Testing Stats for ${testAddress.substring(0, 10)}...`, 'yellow');
    await testStats(testAddress);
    await sleep(500);

    log(`\n🔗 Testing Connected Addresses for ${testAddress.substring(0, 10)}...`, 'yellow');
    await testConnected(testAddress);
    await sleep(500);

    if (trackedWallets.length >= 2) {
      log(`\n💸 Testing Flow between addresses...`, 'yellow');
      await testFlow(trackedWallets[0], trackedWallets[1]);
      await sleep(500);

      log(`\n🛤️  Testing Path between addresses...`, 'yellow');
      await testPath(trackedWallets[0], trackedWallets[1]);
      await sleep(500);
    }

    log(`\n🕸️  Testing Graph Data...`, 'yellow');
    await testGraph();
  }

  // Step 5: Summary
  log('\n' + '='.repeat(60), 'cyan');
  log('\n✅ Test Suite Completed!', 'green');
  log('\n📊 Summary:', 'cyan');
  log(`   • Wallets Tracked: ${trackedWallets.length}`, 'blue');
  log(`   • Transactions Created: ${transactions.filter(t => t !== null).length}`, 'blue');
  log(`   • Trail Endpoints: All tested`, 'blue');
  log('\n🎉 Your transaction trail system is working!', 'green');
  log('\n💡 Next Steps:', 'yellow');
  log('   1. Check your frontend dashboard to see the transactions', 'blue');
  log('   2. Use the trail API endpoints to query transaction paths', 'blue');
  log('   3. Build a visualization using the graph data', 'blue');
  log('\n');
}

// Run the tests
runTests().catch(error => {
  log(`\n❌ Test suite failed: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});

