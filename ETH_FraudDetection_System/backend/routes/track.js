const express = require('express');
const router = express.Router();

// This will be set by server.js
let walletTracker = null;

function setWalletTracker(tracker) {
  walletTracker = tracker;
}

/**
 * Add address to track
 * POST /api/track/address
 * Body: { address: "0x...", chain?: "ethereum" }
 */
router.post('/address', async (req, res) => {
  try {
    const { address, chain } = req.body;
    
    if (!address) {
      return res.status(400).json({ error: 'Address is required' });
    }

    if (!walletTracker) {
      return res.status(503).json({ error: 'Wallet tracker not initialized' });
    }

    await walletTracker.addAddress(address);
    
    const tracked = walletTracker.getTrackedAddresses();
    res.json({ 
      success: true, 
      message: `Address ${address} added to tracking`,
      trackedAddresses: Array.isArray(tracked.addresses) ? tracked.addresses : [],
      trackedContracts: Array.isArray(tracked.contracts) ? tracked.contracts : []
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Add contract to track
 * POST /api/track/contract
 * Body: { address: "0x...", chain?: "ethereum" }
 */
router.post('/contract', async (req, res) => {
  try {
    const { address } = req.body;
    
    if (!address) {
      return res.status(400).json({ error: 'Contract address is required' });
    }

    if (!walletTracker) {
      return res.status(503).json({ error: 'Wallet tracker not initialized' });
    }

    walletTracker.addContract(address);
    
    const tracked = walletTracker.getTrackedAddresses();
    res.json({ 
      success: true, 
      message: `Contract ${address} added to tracking`,
      trackedAddresses: Array.isArray(tracked.addresses) ? tracked.addresses : [],
      trackedContracts: Array.isArray(tracked.contracts) ? tracked.contracts : []
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Remove address from tracking
 * DELETE /api/track/address/:address
 */
router.delete('/address/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    if (!walletTracker) {
      return res.status(503).json({ error: 'Wallet tracker not initialized' });
    }

    walletTracker.removeAddress(address);
    
    const tracked = walletTracker.getTrackedAddresses();
    res.json({ 
      success: true, 
      message: `Address ${address} removed from tracking`,
      trackedAddresses: Array.isArray(tracked.addresses) ? tracked.addresses : [],
      trackedContracts: Array.isArray(tracked.contracts) ? tracked.contracts : []
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get all tracked addresses
 * GET /api/track/addresses
 */
router.get('/addresses', (req, res) => {
  try {
    if (!walletTracker) {
      return res.status(503).json({ error: 'Wallet tracker not initialized' });
    }

    const tracked = walletTracker.getTrackedAddresses();
    res.json({ 
      trackedAddresses: tracked.addresses,
      trackedContracts: tracked.contracts,
      count: tracked.addresses.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = { router, setWalletTracker };

