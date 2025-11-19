#!/usr/bin/env node

/**
 * Seed test data into Neo4j for tracer testing
 * Run this before testing the tracer
 */

const Neo4jClient = require('../backend/src/graph/neo4jClient');
const MemoryGraphClient = require('../backend/src/graph/memoryGraphClient');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Use memory graph if USE_MEMORY_GRAPH is set
const USE_MEMORY = process.env.USE_MEMORY_GRAPH === 'true' || !process.env.NEO4J_URI;

async function seedTestData() {
  let graph = null;
  
  if (USE_MEMORY) {
    console.log('📦 Using in-memory graph (no Neo4j needed)');
    graph = new MemoryGraphClient();
  } else {
    // Try to connect with different password options
    const passwords = [
      process.env.NEO4J_PASSWORD,
      'neo4j',
      'fraud-trail-password',
      'password'
    ].filter(Boolean);
    
    let connected = false;
    
    for (const password of passwords) {
      try {
        process.env.NEO4J_PASSWORD = password;
        graph = new Neo4jClient();
        const isConnected = await graph.testConnection();
        if (isConnected) {
          console.log(`✅ Connected to Neo4j with password: ${password === 'neo4j' ? 'default (neo4j)' : 'custom'}`);
          connected = true;
          break;
        }
      } catch (error) {
        if (graph) await graph.close();
        continue;
      }
    }
    
    if (!connected || !graph) {
      console.error('❌ Could not connect to Neo4j.');
      console.error('💡 Tip: Set USE_MEMORY_GRAPH=true in .env to use in-memory graph instead');
      process.exit(1);
    }
  }
  
  try {
    console.log(`🌱 Seeding test data into ${USE_MEMORY ? 'in-memory graph' : 'Neo4j'}...`);

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
      await graph.upsertActor(fromActor, { type: 'chain' });
      await graph.upsertActor(toActor, { 
        type: tx.to.startsWith('exchange:') ? 'exchange' : 'chain' 
      });

      // Create SENT relationship
      await graph.createSentRelationship(fromActor, toActor, {
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
        await graph.upsertActor(bankActor, { type: 'bank' });
        await graph.upsertActor(exchangeActor, { type: 'exchange' });
        await graph.upsertActor(walletActor, { type: 'chain' });

        // Stitch bank -> exchange (via P2P order)
        if (!USE_MEMORY) {
          const session = graph.driver.session();
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
        } else {
          // For memory graph, create identity relationship
          await graph.upsertActor(bankActor, { type: 'bank' });
          await graph.upsertActor(exchangeActor, { type: 'exchange' });
          if (!graph.relationships.has(bankActor)) {
            graph.relationships.set(bankActor, []);
          }
          graph.relationships.get(bankActor).push({
            to: exchangeActor,
            type: 'IDENTITY',
            confidence: 0.95,
            source: 'p2p_order'
          });
        }

        // Stitch exchange -> wallet
        await graph.stitchExchangeIdentity(order.order_id, walletAddress);

        console.log(`  ✅ ${bankActor} <-> ${exchangeActor} <-> ${walletActor}`);
      }
    }

    console.log('\n✅ Test data seeded successfully!');
    if (USE_MEMORY) {
      const stats = graph.getStats();
      console.log(`📊 Graph stats: ${stats.actors} actors, ${stats.relationships} relationships`);
    }
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
    await graph.close();
  }
}

// Run if executed directly
if (require.main === module) {
  seedTestData();
}

module.exports = { seedTestData };

