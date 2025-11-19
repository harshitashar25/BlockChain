/**
 * Load Complete Mock Dataset
 * This script loads the complete mock dataset into the system
 */

const fs = require('fs');
const path = require('path');

// Try to load axios
let axios;
try {
  axios = require('axios');
} catch (e) {
  try {
    const backendPath = path.join(__dirname, '../backend');
    axios = require(path.join(backendPath, 'node_modules/axios'));
  } catch (e2) {
    console.error('❌ Error: axios not found. Please run: npm install axios');
    process.exit(1);
  }
}

const API_BASE = process.env.API_BASE || 'http://localhost:4000';
const MOCK_BANK_URL = process.env.MOCK_BANK_URL || 'http://localhost:4001';
const MOCK_EXCHANGE_URL = process.env.MOCK_EXCHANGE_URL || 'http://localhost:4002';

const datasetPath = path.join(__dirname, '../demo/complete_mock_dataset.json');

async function loadCompleteMockData() {
  console.log('🚀 Loading Complete Mock Dataset...\n');

  // Read dataset
  const dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));

  console.log('📋 Dataset Summary:');
  console.log(`   UTRs: ${dataset.utrs.length}`);
  console.log(`   P2P Orders: ${dataset.p2p_orders.length}`);
  console.log(`   Blockchain Transfers: ${dataset.blockchain_transfers.length}`);
  console.log(`   Final Destinations: ${dataset.final_destinations.length}`);
  console.log(`   Test Cases: ${dataset.freeze_test_cases.length}\n`);

  // Step 1: Load UTRs into mock bank
  console.log('📥 Step 1: Loading UTRs into Mock Bank...');
  for (const utr of dataset.utrs) {
    try {
      // Mock bank will load from synthetic_dataset.json automatically
      // But we can verify it's accessible
      const response = await axios.get(`${MOCK_BANK_URL}/api/bank/utr/${utr.utr}`);
      console.log(`   ✅ UTR ${utr.utr} available`);
    } catch (error) {
      console.log(`   ⚠️  UTR ${utr.utr} not found (may need to add to mock bank)`);
    }
  }

  // Step 2: Load P2P orders into mock exchange
  console.log('\n📥 Step 2: Loading P2P Orders into Mock Exchange...');
  for (const order of dataset.p2p_orders) {
    try {
      const response = await axios.post(`${MOCK_EXCHANGE_URL}/api/exchange/lea/query`, {
        utr: order.utr,
        bank_account_hash: order.seller_account_hash
      });
      console.log(`   ✅ Order ${order.order_id} available`);
    } catch (error) {
      console.log(`   ⚠️  Order ${order.order_id} not found (may need to add to mock exchange)`);
    }
  }

  // Step 3: Ingest blockchain transfers into graph
  console.log('\n📥 Step 3: Ingesting Blockchain Transfers into Graph...');
  let ingested = 0;
  for (const transfer of dataset.blockchain_transfers) {
    try {
      await axios.post(`${API_BASE}/api/graph/ingest`, transfer);
      ingested++;
    } catch (error) {
      console.error(`   ❌ Error ingesting transfer ${transfer.event_id}:`, error.message);
    }
  }
  console.log(`   ✅ Ingested ${ingested}/${dataset.blockchain_transfers.length} transfers`);

  // Step 4: Stitch identities
  console.log('\n🔗 Step 4: Stitching Identities...');
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

      console.log(`   ✅ Stitched: ${order.order_id} → ${order.withdrawal_wallet}`);
    } catch (error) {
      console.error(`   ❌ Error stitching ${order.order_id}:`, error.message);
    }
  }

  // Step 5: Create test cases
  console.log('\n📋 Step 5: Creating Test Cases...');
  for (const testCase of dataset.freeze_test_cases) {
    try {
      await axios.post(`${API_BASE}/api/fabric/submit-evidence`, {
        caseId: testCase.case_id,
        evidenceHash: `sha256:test-${testCase.case_id}`,
        requester: 'bank:HDFC'
      });
      console.log(`   ✅ Case ${testCase.case_id} created`);
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.error?.includes('already exists')) {
        console.log(`   ⚠️  Case ${testCase.case_id} already exists`);
      } else {
        console.error(`   ❌ Error creating case ${testCase.case_id}:`, error.message);
      }
    }
  }

  console.log('\n✅ Complete Mock Dataset Loaded!');
  console.log('\n📋 Test Cases Ready:');
  dataset.freeze_test_cases.forEach(tc => {
    console.log(`   - ${tc.case_id} (UTR: ${tc.utr})`);
    console.log(`     Expected assets: ${tc.expected_assets.length}`);
    console.log(`     Final destination: ${tc.final_destination}`);
  });

  console.log('\n🎯 Next Steps:');
  console.log('   1. Go to LEA Dashboard');
  console.log('   2. Find case CASE-FREEZE-TEST-001 or CASE-FREEZE-TEST-002');
  console.log('   3. Click "Run Trace" with UTR-FREEZE-001 or UTR-FREEZE-002');
  console.log('   4. Request freeze');
  console.log('   5. Approve 3 times');
  console.log('   6. All assets will freeze including final destinations!');
}

// Run if called directly
if (require.main === module) {
  loadCompleteMockData().catch(console.error);
}

module.exports = { loadCompleteMockData };

