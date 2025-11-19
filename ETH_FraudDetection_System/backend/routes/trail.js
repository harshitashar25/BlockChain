const express = require('express');
const router = express.Router();

let walletTracker = null;
let transactionTrail = null;

function setWalletTracker(tracker) {
  walletTracker = tracker;
}

function setTransactionTrail(trail) {
  transactionTrail = trail;
}

/**
 * Get transaction flow between two addresses
 * GET /api/trail/flow?from=0x...&to=0x...
 */
router.get('/flow', (req, res) => {
  try {
    const { from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({ error: 'from and to addresses are required' });
    }

    if (!transactionTrail) {
      return res.status(503).json({ error: 'Transaction trail not initialized' });
    }

    const flows = transactionTrail.getFlowBetween(from, to);
    res.json({ from, to, flows, count: flows.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Find path between two addresses
 * GET /api/trail/path?from=0x...&to=0x...&maxHops=10
 */
router.get('/path', (req, res) => {
  try {
    const { from, to } = req.query;
    const maxHops = parseInt(req.query.maxHops) || 10;

    if (!from || !to) {
      return res.status(400).json({ error: 'from and to addresses are required' });
    }

    if (!transactionTrail) {
      return res.status(503).json({ error: 'Transaction trail not initialized' });
    }

    const result = transactionTrail.findPath(from, to, maxHops);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get graph data for visualization
 * GET /api/trail/graph?addresses=0x...,0x...&depth=2
 */
router.get('/graph', (req, res) => {
  try {
    const addresses = req.query.addresses 
      ? req.query.addresses.split(',').map(a => a.trim())
      : null;
    const depth = parseInt(req.query.depth) || 2;

    if (!transactionTrail) {
      return res.status(503).json({ error: 'Transaction trail not initialized' });
    }

    const graphData = transactionTrail.getGraphData(addresses, depth);
    res.json(graphData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get address statistics
 * GET /api/trail/stats/:address
 */
router.get('/stats/:address', (req, res) => {
  try {
    const { address } = req.params;

    if (!transactionTrail) {
      return res.status(503).json({ error: 'Transaction trail not initialized' });
    }

    const stats = transactionTrail.getAddressStats(address);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get connected addresses
 * GET /api/trail/connected/:address?depth=3
 */
router.get('/connected/:address', (req, res) => {
  try {
    const { address } = req.params;
    const depth = parseInt(req.query.depth) || 3;

    if (!transactionTrail) {
      return res.status(503).json({ error: 'Transaction trail not initialized' });
    }

    const connected = transactionTrail.getConnectedAddresses(address, depth);
    res.json({ address, connected, count: connected.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get all transactions for an address
 * GET /api/trail/transactions/:address?limit=100
 */
router.get('/transactions/:address', (req, res) => {
  try {
    const { address } = req.params;
    const limit = parseInt(req.query.limit) || 100;

    if (!transactionTrail) {
      return res.status(503).json({ error: 'Transaction trail not initialized' });
    }

    const transactions = transactionTrail.getAddressTransactions(address, limit);
    res.json({ address, transactions, count: transactions.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get transaction trail for an address
 * GET /api/trail/:address?hops=5&direction=both
 * This must be LAST because it matches any address
 */
router.get('/:address', (req, res) => {
  try {
    const { address } = req.params;
    const hops = parseInt(req.query.hops) || 5;
    const direction = req.query.direction || 'both'; // both, incoming, outgoing

    if (!transactionTrail) {
      return res.status(503).json({ error: 'Transaction trail not initialized' });
    }

    const trail = transactionTrail.buildTrail(address, hops, direction);
    res.json(trail);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = { router, setWalletTracker, setTransactionTrail };

