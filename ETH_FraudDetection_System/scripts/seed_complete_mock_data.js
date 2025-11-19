/**
 * Seed Complete Mock Dataset into Graph
 * This seeds all blockchain transfers so they're available for tracing
 * 
 * Run from backend directory: node ../scripts/seed_complete_mock_data.js
 * Or install dependencies in scripts: npm install axios dotenv
 */

const fs = require('fs');
const path = require('path');

// Load axios - try local first, then backend
let axios;
try {
  // Try current directory (scripts/node_modules)
  axios = require('axios');
} catch (e) {
  try {
    // Try backend node_modules
    const backendPath = path.join(__dirname, '../backend');
    const Module = require('module');
    const originalRequire = Module.prototype.require;
    Module.prototype.require = function(id) {
      if (id === 'axios') {
        try {
          return originalRequire.call(this, path.join(backendPath, 'node_modules/axios'));
        } catch (e) {
          return originalRequire.apply(this, arguments);
        }
      }
      return originalRequire.apply(this, arguments);
    };
    axios = require('axios');
    Module.prototype.require = originalRequire;
  } catch (e2) {
    console.error('❌ Error: axios not found. Please run:');
    console.error('   cd scripts && npm install axios dotenv');
    process.exit(1);
  }
}

// Try to load dotenv
try {
  require('dotenv').config({ path: path.join(__dirname, '../.env') });
} catch (e) {
  // dotenv not critical, continue
}

const API_BASE = process.env.API_BASE || 'http://localhost:4000';
const datasetPath = path.join(__dirname, '../demo/complete_mock_dataset.json');

async function seedCompleteMockData() {
  console.log('🌱 Seeding Complete Mock Dataset into Graph...\n');

  // Read dataset
  const dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));

  console.log(`📊 Dataset: ${dataset.blockchain_transfers.length} transfers to seed\n`);

  // Ingest all blockchain transfers
  let success = 0;
  let failed = 0;

  for (const transfer of dataset.blockchain_transfers) {
    try {
      await axios.post(`${API_BASE}/api/graph/ingest`, transfer);
      success++;
      console.log(`   ✅ ${transfer.event_id}: ${transfer.from.slice(0, 10)}... → ${transfer.to.slice(0, 10)}... (${transfer.amount} ${transfer.token_symbol})`);
    } catch (error) {
      failed++;
      console.error(`   ❌ ${transfer.event_id}: ${error.message}`);
    }
  }

  console.log(`\n✅ Seeded ${success}/${dataset.blockchain_transfers.length} transfers`);
  if (failed > 0) {
    console.log(`   ⚠️  ${failed} failed`);
  }

  // Stitch identities
  console.log('\n🔗 Stitching Identities...');
  for (const order of dataset.p2p_orders) {
    try {
      // Stitch bank to wallet
      await axios.post(`${API_BASE}/api/graph/stitch/bank`, {
        bankAccountHash: order.seller_account_hash,
        walletAddress: order.withdrawal_wallet
      });

      // Stitch exchange to wallet
      await axios.post(`${API_BASE}/api/graph/stitch/exchange`, {
        exchangeOrderId: order.order_id,
        walletAddress: order.withdrawal_wallet
      });

      console.log(`   ✅ ${order.order_id} → ${order.withdrawal_wallet}`);
    } catch (error) {
      console.error(`   ❌ Error stitching ${order.order_id}: ${error.message}`);
    }
  }

  console.log('\n✅ Complete Mock Dataset Seeded!');
  console.log('\n🎯 Ready to Test:');
  console.log('   1. Submit case with UTR-FREEZE-001');
  console.log('   2. Run trace - will find all 8 assets');
  console.log('   3. Request freeze');
  console.log('   4. Approve 3 times');
  console.log('   5. All assets frozen including final destination!');
}

// Run if called directly
if (require.main === module) {
  seedCompleteMockData().catch(console.error);
}

module.exports = { seedCompleteMockData };

