#!/usr/bin/env node
/**
 * Script to ensure mock dataset is loaded and use it for tracing
 * This ensures Investigator Trace shows the correct mock addresses
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const API_BASE = process.env.API_BASE_URL || 'http://localhost:4000';
const datasetPath = path.join(__dirname, '../demo/complete_mock_dataset.json');

async function seedMockData() {
  console.log('🌱 Seeding Mock Dataset into Graph...\n');

  // Read dataset
  const dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));

  console.log(`📋 Dataset Summary:`);
  console.log(`   Blockchain Transfers: ${dataset.blockchain_transfers.length}`);
  console.log(`   Expected addresses:`);
  console.log(`     - 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb (withdrawal)`);
  console.log(`     - 0xd4fe23d3f98AD0bdAC21Cd2d93100EE6055A49 (intermediate)`);
  console.log(`     - 0xfeaaed0e3f98AD0bdAC21Cd2d93100EE6055A49 (intermediate)`);
  console.log(`     - 0x8888888888888888888888888888888888888888`);
  console.log(`     - 0x9999999999999999999999999999999999999999`);
  console.log(`     - exchange:binance_deposit_wallet (final)\n`);

  // Step 1: Ingest all blockchain transfers
  console.log('📥 Step 1: Ingesting blockchain transfers...');
  let ingested = 0;
  for (const transfer of dataset.blockchain_transfers) {
    try {
      // Convert mock transfer format to graph format
      const graphTransfer = {
        from: transfer.from,
        to: transfer.to,
        value: transfer.amount_raw || transfer.amount,
        token: transfer.token_address || '0x0000000000000000000000000000000000000000',
        tokenSymbol: transfer.token_symbol || 'ETH',
        timestamp: transfer.timestamp,
        txHash: transfer.tx_hash,
        chain: transfer.chain || 'eth',
        source: 'mock'
      };

      // Ingest via graph API - must include event_id, from, to
      await axios.post(`${API_BASE}/api/graph/ingest`, {
        event_id: transfer.event_id,
        from: transfer.from,
        to: transfer.to,
        amount: transfer.amount_raw || transfer.amount,
        token: transfer.token_address || '0x0000000000000000000000000000000000000000',
        token_symbol: transfer.token_symbol || 'ETH',
        timestamp: transfer.timestamp,
        tx_hash: transfer.tx_hash,
        chain: transfer.chain || 'eth'
      });
      ingested++;
    } catch (error) {
      console.error(`   ⚠️  Error ingesting transfer ${transfer.event_id}:`, error.message);
    }
  }
  console.log(`   ✅ Ingested ${ingested}/${dataset.blockchain_transfers.length} transfers\n`);

  // Step 2: Stitch identities
  console.log('🔗 Step 2: Stitching identities...');
  for (const utrData of dataset.utrs) {
    const muleAccount = `bank:${utrData.downstream[0]?.account_hash || utrData.remitter.account_hash}`;
    const withdrawalWallet = dataset.p2p_orders.find(o => o.utr === utrData.utr)?.withdrawal_wallet;
    
    if (withdrawalWallet) {
      try {
        await axios.post(`${API_BASE}/api/graph/stitch/bank`, {
          bankAccountHash: muleAccount.replace('bank:', ''),
          walletAddress: withdrawalWallet
        });
        
        // Also stitch exchange
        const order = dataset.p2p_orders.find(o => o.utr === utrData.utr);
        if (order) {
          await axios.post(`${API_BASE}/api/graph/stitch/exchange`, {
            exchangeOrderId: order.order_id,
            walletAddress: withdrawalWallet
          });
        }
        console.log(`   ✅ Stitched: ${muleAccount} <-> chain:${withdrawalWallet}`);
      } catch (error) {
        console.error(`   ⚠️  Error stitching ${muleAccount}:`, error.message);
      }
    }
  }
  console.log('');

  // Step 3: Verify data is in graph
  console.log('🔍 Step 3: Verifying data in graph...');
  try {
    const traceResponse = await axios.get(`${API_BASE}/api/tracer/trace`, {
      params: {
        seed: 'chain:0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        depth: 6,
        hours: 168,
        minAmt: 0.01
      }
    });

    const result = traceResponse.data.result;
    const nodeIds = result.nodes.map(n => n.id);
    
    console.log(`   ✅ Found ${result.total_nodes} nodes in graph`);
    console.log(`   ✅ Found ${result.total_paths} paths`);
    
    // Check if expected addresses are present
    const expectedAddresses = [
      'chain:0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      'chain:0xd4fe23d3f98AD0bdAC21Cd2d93100EE6055A49',
      'chain:0xfeaaed0e3f98AD0bdAC21Cd2d93100EE6055A49',
      'chain:0x8888888888888888888888888888888888888888',
      'chain:0x9999999999999999999999999999999999999999',
      'exchange:binance_deposit_wallet'
    ];

    console.log('\n   📊 Expected addresses check:');
    expectedAddresses.forEach(addr => {
      const found = nodeIds.some(id => id.toLowerCase() === addr.toLowerCase());
      console.log(`      ${found ? '✅' : '❌'} ${addr}`);
    });

    console.log('\n✅ Mock dataset seeded successfully!');
    console.log('\n🎯 Now in Investigator Trace UI:');
    console.log('   1. Enter: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');
    console.log('   2. Click "Trace"');
    console.log('   3. You should see the mock addresses from complete_mock_dataset.json!');
    
  } catch (error) {
    console.error('   ❌ Error verifying:', error.message);
    if (error.response) {
      console.error('   Response:', error.response.data);
    }
  }
}

// Run
seedMockData().catch(error => {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
});

