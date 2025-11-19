const express = require('express');
const router = express.Router();

let walletTracker = null;

function setWalletTracker(tracker) {
  walletTracker = tracker;
}

/**
 * Get current block number
 * GET /api/blockchain/block/current
 */
router.get('/block/current', async (req, res) => {
  try {
    if (!walletTracker) {
      return res.status(503).json({ error: 'Wallet tracker not initialized' });
    }

    const blockNumber = await walletTracker.getCurrentBlock();
    res.json({ blockNumber });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get system status
 * GET /api/blockchain/status
 */
router.get('/status', (req, res) => {
  try {
    if (!walletTracker) {
      return res.status(503).json({ error: 'Wallet tracker not initialized' });
    }

    const tracked = walletTracker.getTrackedAddresses();
    const recentTransactions = walletTracker.getTransactions(10);
    
    res.json({
      status: 'running',
      chain: walletTracker.chainName,
      trackedAddresses: tracked.addresses.length,
      trackedContracts: tracked.contracts.length,
      recentTransactions: recentTransactions.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = { router, setWalletTracker };

