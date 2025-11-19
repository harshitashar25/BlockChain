const express = require('express');
const router = express.Router();
const MoralisClient = require('../services/moralisClient');

const moralisClient = new MoralisClient();

/**
 * GET /api/moralis/address/:address/transfers
 * Fetch ERC20 transfers for an address
 * Query params: chain (default: eth), limit, cursor
 */
router.get('/address/:address/transfers', async (req, res) => {
  try {
    const { address } = req.params;
    const { chain = 'eth', limit, cursor } = req.query;

    if (!address || !address.match(/^0x[a-fA-F0-9]{40}$/)) {
      return res.status(400).json({
        error: 'Invalid address format. Must be a valid Ethereum address (0x...).'
      });
    }

    const options = {};
    if (limit) options.limit = parseInt(limit, 10);
    if (cursor) options.cursor = cursor;

    const transfers = await moralisClient.getTransfers(address, chain, options);

    res.json({
      ok: true,
      address: address.toLowerCase(),
      chain: chain,
      count: transfers.length,
      transfers: transfers
    });

  } catch (error) {
    console.error('Error in /api/moralis/address/:address/transfers:', error);
    res.status(500).json({
      error: 'Failed to fetch transfers',
      message: error.message
    });
  }
});

/**
 * GET /api/moralis/address/:address/native
 * Fetch native token transfers (ETH, BNB, etc.)
 */
router.get('/address/:address/native', async (req, res) => {
  try {
    const { address } = req.params;
    const { chain = 'eth', limit } = req.query;

    if (!address || !address.match(/^0x[a-fA-F0-9]{40}$/)) {
      return res.status(400).json({
        error: 'Invalid address format.'
      });
    }

    const options = { limit: limit ? parseInt(limit, 10) : 100 };
    const transfers = await moralisClient.getNativeTransfers(address, chain, options);

    res.json({
      ok: true,
      address: address.toLowerCase(),
      chain: chain,
      count: transfers.length,
      transfers: transfers
    });

  } catch (error) {
    console.error('Error in /api/moralis/address/:address/native:', error);
    res.status(500).json({
      error: 'Failed to fetch native transfers',
      message: error.message
    });
  }
});

/**
 * GET /api/moralis/health
 * Check Moralis client status
 */
router.get('/health', (req, res) => {
  const hasApiKey = !!process.env.MORALIS_API_KEY;
  res.json({
    ok: true,
    hasApiKey: hasApiKey,
    mode: hasApiKey ? 'production' : 'synthetic',
    baseURL: moralisClient.baseURL
  });
});

module.exports = router;

