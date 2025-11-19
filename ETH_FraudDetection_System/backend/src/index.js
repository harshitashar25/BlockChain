const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

// Import routes
const moralisRoutes = require('./routes/moralis');
const moralisIngestRoutes = require('./routes/moralisIngest');
const graphRoutes = require('./routes/graph');
const graphDebugRoutes = require('./routes/graphDebug');
const bridgeRoutes = require('./routes/bridge');
const tracerRoutes = require('./routes/tracer');
const fabricRoutes = require('./routes/fabric');
const bankHoldRoutes = require('./routes/bankHold');
const freezeRoutes = require('./routes/freeze');
const automatedTraceRoutes = require('./routes/automatedTrace');
const seedRoutes = require('./routes/seed');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

// Routes
app.use('/api/moralis', moralisRoutes);
app.use('/api/moralis', moralisIngestRoutes); // Additional Moralis endpoints
app.use('/api/graph', graphRoutes);
app.use('/api/graph/debug', graphDebugRoutes);
app.use('/api/bridge', bridgeRoutes);
app.use('/api/tracer', tracerRoutes);
app.use('/api/fabric', fabricRoutes);
app.use('/api/bank-hold', bankHoldRoutes);
app.use('/api/freeze', freezeRoutes);
app.use('/api/automated-trace', automatedTraceRoutes);
app.use('/api/seed', seedRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    ok: true,
    timestamp: new Date().toISOString(),
    service: 'fraud-trail-backend',
    version: '1.0.0'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Fraud Trail Backend',
    version: '1.0.0',
    description: 'Permissioned blockchain fraud-trail system',
    endpoints: {
      health: '/health',
      moralis: '/api/moralis'
    }
  });
});

// Auto-seed data if using in-memory graph
if (process.env.USE_MEMORY_GRAPH === 'true' || !process.env.NEO4J_URI) {
  const { getSharedGraph } = require('./graph/sharedMemoryGraph');
  const fs = require('fs');
  const path = require('path');
  
  setTimeout(async () => {
    try {
      console.log('🌱 Auto-seeding test data into in-memory graph...');
      const graph = getSharedGraph();
      const datasetPath = path.join(__dirname, '../demo/synthetic_dataset.json');
      
      if (fs.existsSync(datasetPath)) {
        const dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));
        
        // Seed on-chain transfers
        for (const tx of dataset.on_chain_transfers || []) {
          const fromActor = `chain:${tx.from.toLowerCase()}`;
          const toActor = tx.to.startsWith('exchange:') ? tx.to : `chain:${tx.to.toLowerCase()}`;
          
          await graph.upsertActor(fromActor, { type: 'chain' });
          await graph.upsertActor(toActor, { type: tx.to.startsWith('exchange:') ? 'exchange' : 'chain' });
          
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
        }
        
        // Seed identity stitching
        for (const order of dataset.p2p_orders || []) {
          const utr = dataset.utrs.find(u => u.utr === order.utr);
          if (utr) {
            const bankAccountHash = utr.remitter.account_hash;
            const bankActor = `bank:${bankAccountHash}`;
            const exchangeActor = `exchange:${order.order_id}`;
            const walletAddress = order.withdrawal_wallet.toLowerCase();
            const walletActor = `chain:${walletAddress}`;
            
            await graph.upsertActor(bankActor, { type: 'bank' });
            await graph.upsertActor(exchangeActor, { type: 'exchange' });
            await graph.upsertActor(walletActor, { type: 'chain' });
            
            if (!graph.relationships.has(bankActor)) {
              graph.relationships.set(bankActor, []);
            }
            graph.relationships.get(bankActor).push({
              to: exchangeActor,
              type: 'IDENTITY',
              confidence: 0.95,
              source: 'p2p_order'
            });
            
            await graph.stitchExchangeIdentity(order.order_id, walletAddress);
          }
        }
        
        const stats = graph.getStats();
        console.log(`✅ Auto-seeded: ${stats.actors} actors, ${stats.relationships} relationships`);
      }
    } catch (error) {
      console.warn('⚠️  Auto-seed failed (you can seed manually via API):', error.message);
    }
  }, 1000); // Wait 1 second after server starts
}

// Start server
app.listen(PORT, () => {
  console.log(`✅ Fraud Trail Backend running on port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 Moralis API: http://localhost:${PORT}/api/moralis`);
  if (process.env.USE_MEMORY_GRAPH === 'true' || !process.env.NEO4J_URI) {
    console.log(`📦 Using in-memory graph (auto-seeding on startup)`);
  }
});

