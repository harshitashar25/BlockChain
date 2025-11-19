const express = require('express');
const router = express.Router();
const BridgeWatcher = require('../services/bridgeWatcher');

const bridgeWatcher = new BridgeWatcher();

/**
 * POST /api/bridge/process
 * Process a transfer event for bridge detection
 */
router.post('/process', async (req, res) => {
  try {
    const transferEvent = req.body;
    await bridgeWatcher.processTransferEvent(transferEvent);

    res.json({
      ok: true,
      message: 'Transfer event processed for bridge detection'
    });
  } catch (error) {
    console.error('Error processing bridge event:', error);
    res.status(500).json({
      error: 'Failed to process bridge event',
      message: error.message
    });
  }
});

/**
 * POST /api/bridge/register
 * Manually register a bridge event pair
 */
router.post('/register', async (req, res) => {
  try {
    const { lockEvent, mintEvent, bridgeName } = req.body;

    if (!lockEvent || !mintEvent) {
      return res.status(400).json({
        error: 'Missing required fields: lockEvent, mintEvent'
      });
    }

    await bridgeWatcher.registerBridgeEvent(lockEvent, mintEvent, bridgeName);

    res.json({
      ok: true,
      message: 'Bridge event registered'
    });
  } catch (error) {
    console.error('Error registering bridge event:', error);
    res.status(500).json({
      error: 'Failed to register bridge event',
      message: error.message
    });
  }
});

/**
 * GET /api/bridge/registry
 * Get bridge registry
 */
router.get('/registry', (req, res) => {
  res.json({
    ok: true,
    registry: bridgeWatcher.bridgeRegistry
  });
});

module.exports = router;

