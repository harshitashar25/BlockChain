const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { getSharedGraph } = require('../graph/sharedMemoryGraph');
require('dotenv').config();

/**
 * POST /api/seed/data
 * Seed test data into the graph (for in-memory graph)
 */
router.post('/data', async (req, res) => {
  try {
    const graph = getSharedGraph();
    
    // Load synthetic dataset
    const datasetPath = path.join(__dirname, '../../demo/synthetic_dataset.json');
    const dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));

    let count = 0;

    // Seed on-chain transfers
    for (const tx of dataset.on_chain_transfers || []) {
      const fromActor = `chain:${tx.from.toLowerCase()}`;
      const toActor = tx.to.startsWith('exchange:') 
        ? tx.to 
        : `chain:${tx.to.toLowerCase()}`;

      await graph.upsertActor(fromActor, { type: 'chain' });
      await graph.upsertActor(toActor, { 
        type: tx.to.startsWith('exchange:') ? 'exchange' : 'chain' 
      });

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
      count++;
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

        // Create identity relationships
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
        count++;
      }
    }

    const stats = graph.getStats();

    res.json({
      ok: true,
      message: 'Data seeded successfully',
      relationships_created: count,
      stats: stats
    });
  } catch (error) {
    console.error('Error seeding data:', error);
    res.status(500).json({
      error: 'Failed to seed data',
      message: error.message
    });
  }
});

/**
 * GET /api/seed/stats
 * Get graph statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const graph = getSharedGraph();
    const stats = graph.getStats();
    res.json({
      ok: true,
      stats: stats
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get stats',
      message: error.message
    });
  }
});

module.exports = router;

