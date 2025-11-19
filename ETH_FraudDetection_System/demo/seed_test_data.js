#!/usr/bin/env node

/**
 * Seed test data into Neo4j for tracer testing
 * Run this before testing the tracer
 */

const Neo4jClient = require('../backend/src/graph/neo4jClient');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function seedTestData() {
  // Try to connect with different password options
  const passwords = [
    process.env.NEO4J_PASSWORD,
    'neo4j',
    'fraud-trail-password',
    'password'
  ].filter(Boolean);
  
  let neo4j = null;
  let connected = false;
  
  for (const password of passwords) {
    try {
      process.env.NEO4J_PASSWORD = password;
      neo4j = new Neo4jClient();
      const isConnected = await neo4j.testConnection();
      if (isConnected) {
        console.log(`✅ Connected to Neo4j with password: ${password === 'neo4j' ? 'default (neo4j)' : 'custom'}`);
        connected = true;
        break;
      }
    } catch (error) {
      if (neo4j) await neo4j.close();
      continue;
    }
  }
  
  if (!connected || !neo4j) {
    console.error('❌ Could not connect to Neo4j. Please check:');
    console.error('   1. Neo4j is running: neo4j status');
    console.error('   2. Password in .env matches Neo4j password');
    console.error('   3. Default password is "neo4j" (change on first login)');
    process.exit(1);
  }
  
  try {
    console.log('🌱 Seeding test data into Neo4j...');

    // Load synthetic dataset
    const datasetPath = path.join(__dirname, 'synthetic_dataset.json');
    const dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));

    // Seed actors and relationships from on-chain transfers
    console.log('\n📊 Ingesting on-chain transfers...');
    for (const tx of dataset.on_chain_transfers || []) {
      const fromActor = `chain:${tx.from.toLowerCase()}`;
      const toActor = tx.to.startsWith('exchange:') 
        ? tx.to 
        : `chain:${tx.to.toLowerCase()}`;

      // Upsert actors
      await neo4j.upsertActor(fromActor, { type: 'chain' });
      await neo4j.upsertActor(toActor, { 
        type: tx.to.startsWith('exchange:') ? 'exchange' : 'chain' 
      });

      // Create SENT relationship
      await neo4j.createSentRelationship(fromActor, toActor, {
        event_id: tx.event_id || `event-${tx.tx_hash}`,
        amount: tx.amount || '0',
        amount_raw: tx.amount_raw || '0',
        token_symbol: tx.token_symbol || 'ETH',
        chain: tx.chain || 'eth',
        tx_hash: tx.tx_hash || '',
        block_number: tx.block_number || 0,
        timestamp: tx.timestamp || new Date().toISOString()
      });

      console.log(`  ✅ ${fromActor} -> ${toActor} (${tx.amount} ${tx.token_symbol})`);
    }

    // Seed identity stitching: bank -> exchange -> wallet
    console.log('\n🔗 Stitching identities...');
    for (const order of dataset.p2p_orders || []) {
      const utr = dataset.utrs.find(u => u.utr === order.utr);
      if (utr) {
        // Bank account hash
        const bankAccountHash = utr.remitter.account_hash;
        const bankActor = `bank:${bankAccountHash}`;
        
        // Exchange order
        const exchangeActor = `exchange:${order.order_id}`;
        
        // Wallet
        const walletAddress = order.withdrawal_wallet.toLowerCase();
        const walletActor = `chain:${walletAddress}`;

        // Upsert actors
        await neo4j.upsertActor(bankActor, { type: 'bank' });
        await neo4j.upsertActor(exchangeActor, { type: 'exchange' });
        await neo4j.upsertActor(walletActor, { type: 'chain' });

        // Stitch bank -> exchange (via P2P order)
        const session = neo4j.driver.session();
        try {
          await session.run(`
            MATCH (bank:Actor {id: $bankActor})
            MATCH (exchange:Actor {id: $exchangeActor})
            MERGE (bank)-[r:IDENTITY {
              confidence: 0.95,
              source: 'p2p_order',
              created_at: datetime()
            }]-(exchange)
            RETURN r
          `, { bankActor, exchangeActor });
        } finally {
          await session.close();
        }

        // Stitch exchange -> wallet
        await neo4j.stitchExchangeIdentity(order.order_id, walletAddress);

        console.log(`  ✅ ${bankActor} <-> ${exchangeActor} <-> ${walletActor}`);
      }
    }

    console.log('\n✅ Test data seeded successfully!');
    console.log('\n📋 Sample actors created:');
    console.log('  - chain:0x742d35cc6634c0532925a3b844bc9e7595f0beb');
    console.log('  - chain:0x8ba1f109551bd432803012645hac136c22c9c');
    console.log('  - exchange:P2P-ORDER-001');
    console.log('\n🧪 You can now test the tracer with:');
    console.log('  curl "http://localhost:4000/api/tracer/trace?seed=chain:0x742d35cc6634c0532925a3b844bc9e7595f0beb&depth=6&hours=48"');

  } catch (error) {
    console.error('❌ Error seeding test data:', error.message);
    process.exit(1);
  } finally {
    await neo4j.close();
  }
}

// Run if executed directly
if (require.main === module) {
  seedTestData();
}

module.exports = { seedTestData };

