const express = require('express');
const router = express.Router();

let walletTracker = null;

function setWalletTracker(tracker) {
  walletTracker = tracker;
}

/**
 * Configure webhook for an address
 * POST /api/webhooks/config
 * Body: { address: "0x...", webhookUrl: "https://...", secret?: "..." }
 */
router.post('/config', (req, res) => {
  try {
    const { address, webhookUrl, secret } = req.body;
    
    if (!address || !webhookUrl) {
      return res.status(400).json({ error: 'Address and webhookUrl are required' });
    }

    if (!walletTracker) {
      return res.status(503).json({ error: 'Wallet tracker not initialized' });
    }

    walletTracker.configureWebhook(address, webhookUrl, secret);
    
    res.json({ 
      success: true, 
      message: `Webhook configured for ${address}`,
      webhookUrl
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get webhook configuration for an address
 * GET /api/webhooks/config/:address
 */
router.get('/config/:address', (req, res) => {
  try {
    const { address } = req.params;
    
    if (!walletTracker) {
      return res.status(503).json({ error: 'Wallet tracker not initialized' });
    }

    const config = walletTracker.getWebhookConfig(address);
    
    if (!config) {
      return res.status(404).json({ error: 'Webhook not configured for this address' });
    }

    // Don't return the secret
    res.json({ 
      address,
      webhookUrl: config.url,
      enabled: config.enabled
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Test webhook endpoint (for testing webhook delivery)
 * POST /api/webhooks/test
 * Body: { address: "0x...", webhookUrl: "https://..." }
 */
router.post('/test', async (req, res) => {
  try {
    const { address, webhookUrl } = req.body;
    
    if (!address || !webhookUrl) {
      return res.status(400).json({ error: 'Address and webhookUrl are required' });
    }

    const axios = require('axios');
    
    // Create test payload
    const testPayload = {
      event: 'TEST',
      chain: 'ethereum',
      address: address,
      activity: [{
        type: 'TEST_TRANSACTION',
        hash: '0x' + '0'.repeat(64),
        from: address,
        to: '0x0000000000000000000000000000000000000000',
        value: '0',
        valueEth: '0',
        blockNumber: 0,
        timestamp: new Date().toISOString()
      }],
      timestamp: new Date().toISOString()
    };

    await axios.post(webhookUrl, testPayload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });

    res.json({ 
      success: true, 
      message: 'Test webhook sent successfully',
      webhookUrl
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Webhook test failed', 
      message: error.message 
    });
  }
});

module.exports = { router, setWalletTracker };

