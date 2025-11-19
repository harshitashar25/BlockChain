/**
 * Transaction Intelligence Routes
 * Provides comprehensive blockchain intelligence using Moralis API
 */
const express = require('express');
const router = express.Router();
const MoralisService = require('../services/moralisService');

let moralisService = null;

// Initialize Moralis service with API key
const MORALIS_API_KEY = process.env.MORALIS_API_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6IjlmNWNlYzk0LTY3MDItNGUzYy1hZWVjLWEyYjVjODllYzFkYiIsIm9yZ0lkIjoiNDgyMTA1IiwidXNlcklkIjoiNDk1OTg2IiwidHlwZUlkIjoiZTE1OWUzZWUtMDljZS00N2M4LTkyZGQtMjNjZDczMGFlMWM2IiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3NjM1NDMzMjcsImV4cCI6NDkxOTMwMzMyN30.VevSvlWhV7rg2_uVHDpiqhmseS4egzHldgUiyoQxPfw';

if (MORALIS_API_KEY) {
  moralisService = new MoralisService(MORALIS_API_KEY);
  console.log('✅ Moralis service initialized');
} else {
  console.warn('⚠️  Moralis API key not found');
}

/**
 * Get multi-chain intelligence
 * GET /api/intelligence/:address/multichain?chains=eth,polygon,bsc
 */
router.get('/:address/multichain', async (req, res) => {
  try {
    const { address } = req.params;
    const chains = req.query.chains ? req.query.chains.split(',') : ['eth', 'polygon', 'bsc', 'arbitrum'];

    if (!moralisService) {
      return res.status(503).json({ error: 'Moralis service not initialized' });
    }

    if (!address || !address.startsWith('0x')) {
      return res.status(400).json({ error: 'Invalid Ethereum address' });
    }

    const multiChainData = await moralisService.getMultiChainIntelligence(address, chains);
    res.json(multiChainData);
  } catch (error) {
    console.error('Error fetching multi-chain intelligence:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to fetch multi-chain intelligence',
      details: error.response?.data || null
    });
  }
});

/**
 * Debug endpoint to check bridge detection
 * GET /api/intelligence/:address/debug?chain=eth
 * MUST come before /:address route
 */
router.get('/:address/debug', async (req, res) => {
  try {
    const { address } = req.params;
    const chain = req.query.chain || 'eth';

    if (!moralisService) {
      return res.status(503).json({ error: 'Moralis service not initialized' });
    }

    if (!address || !address.startsWith('0x')) {
      return res.status(400).json({ error: 'Invalid Ethereum address' });
    }

    // Get transactions
    const transactions = await moralisService.getTransactions(address, chain, 100);
    const tokenTransfers = await moralisService.getTokenTransfers(address, chain, 100);
    
    // Get bridge contracts for this chain
    const bridgeContracts = moralisService.bridgeContracts[chain] || [];
    
    // Analyze transactions
    const allTxs = [
      ...(transactions.result || transactions || []),
      ...(tokenTransfers.result || tokenTransfers || [])
    ];
    
    const bridgeAnalysis = {
      address: address.toLowerCase(),
      chain: chain,
      totalTransactions: allTxs.length,
      bridgeContracts: bridgeContracts,
      detectedBridges: [],
      potentialBridges: []
    };

    allTxs.forEach(tx => {
      const to = (tx.to_address || tx.to || '').toLowerCase();
      const from = (tx.from_address || tx.from || '').toLowerCase();
      
      // Check if matches known bridge
      const toIsBridge = bridgeContracts.includes(to);
      const fromIsBridge = bridgeContracts.includes(from);
      
      if (toIsBridge || fromIsBridge) {
        bridgeAnalysis.detectedBridges.push({
          hash: tx.hash || tx.transaction_hash,
          from: from,
          to: to,
          fromIsBridge: fromIsBridge,
          toIsBridge: toIsBridge,
          bridgeType: moralisService.getBridgeType(toIsBridge ? to : from, chain),
          value: tx.value ? (parseFloat(tx.value) / 1e18).toString() : '0',
          timestamp: tx.block_timestamp || tx.blockTimestamp
        });
      }
      
      // Check for common bridge patterns (contract interactions)
      if (tx.to_address && tx.to_address.length === 42 && !toIsBridge && !fromIsBridge) {
        // Could be a bridge we don't know about
        bridgeAnalysis.potentialBridges.push({
          hash: tx.hash || tx.transaction_hash,
          to: to,
          note: 'Unknown contract - might be a bridge'
        });
      }
    });

    res.json(bridgeAnalysis);
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to debug',
      details: error.response?.data || null
    });
  }
});

/**
 * Get transaction trail with graph data
 * GET /api/intelligence/:address/trail?chain=eth&depth=3
 * MUST come before /:address route
 */
router.get('/:address/trail', async (req, res) => {
  try {
    const { address } = req.params;
    const chain = req.query.chain || 'eth';
    const depth = parseInt(req.query.depth) || 3;

    if (!moralisService) {
      return res.status(503).json({ error: 'Moralis service not initialized' });
    }

    if (!address || !address.startsWith('0x')) {
      return res.status(400).json({ error: 'Invalid Ethereum address' });
    }

    const trail = await moralisService.buildTransactionTrail(address, chain, depth);
    res.json(trail);
  } catch (error) {
    console.error('Error building transaction trail:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to build transaction trail',
      details: error.response?.data || null
    });
  }
});

/**
 * Get transactions for an address
 * GET /api/intelligence/:address/transactions?chain=eth&limit=100
 */
router.get('/:address/transactions', async (req, res) => {
  try {
    const { address } = req.params;
    const chain = req.query.chain || 'eth';
    const limit = parseInt(req.query.limit) || 100;

    if (!moralisService) {
      return res.status(503).json({ error: 'Moralis service not initialized' });
    }

    if (!address || !address.startsWith('0x')) {
      return res.status(400).json({ error: 'Invalid Ethereum address' });
    }

    const transactions = await moralisService.getTransactions(address, chain, limit);
    res.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to fetch transactions',
      details: error.response?.data || null
    });
  }
});

/**
 * Get token transfers for an address
 * GET /api/intelligence/:address/token-transfers?chain=eth&limit=100
 */
router.get('/:address/token-transfers', async (req, res) => {
  try {
    const { address } = req.params;
    const chain = req.query.chain || 'eth';
    const limit = parseInt(req.query.limit) || 100;

    if (!moralisService) {
      return res.status(503).json({ error: 'Moralis service not initialized' });
    }

    if (!address || !address.startsWith('0x')) {
      return res.status(400).json({ error: 'Invalid Ethereum address' });
    }

    const transfers = await moralisService.getTokenTransfers(address, chain, limit);
    res.json(transfers);
  } catch (error) {
    console.error('Error fetching token transfers:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to fetch token transfers',
      details: error.response?.data || null
    });
  }
});

/**
 * Get balance information
 * GET /api/intelligence/:address/balance?chain=eth
 */
router.get('/:address/balance', async (req, res) => {
  try {
    const { address } = req.params;
    const chain = req.query.chain || 'eth';

    if (!moralisService) {
      return res.status(503).json({ error: 'Moralis service not initialized' });
    }

    if (!address || !address.startsWith('0x')) {
      return res.status(400).json({ error: 'Invalid Ethereum address' });
    }

    const [nativeBalance, tokenBalances] = await Promise.allSettled([
      moralisService.getNativeBalance(address, chain),
      moralisService.getTokenBalances(address, chain)
    ]);

    res.json({
      address: address.toLowerCase(),
      chain: chain,
      nativeBalance: nativeBalance.status === 'fulfilled' ? nativeBalance.value : null,
      tokenBalances: tokenBalances.status === 'fulfilled' ? tokenBalances.value : []
    });
  } catch (error) {
    console.error('Error fetching balance:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to fetch balance',
      details: error.response?.data || null
    });
  }
});

/**
 * Get comprehensive address intelligence
 * GET /api/intelligence/:address?chain=eth
 * MUST come last after all specific routes
 */
router.get('/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const chain = req.query.chain || 'eth';

    if (!moralisService) {
      return res.status(503).json({ error: 'Moralis service not initialized' });
    }

    if (!address || !address.startsWith('0x')) {
      return res.status(400).json({ error: 'Invalid Ethereum address' });
    }

    const intelligence = await moralisService.getAddressIntelligence(address, chain);
    res.json(intelligence);
  } catch (error) {
    console.error('Error fetching address intelligence:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to fetch address intelligence',
      details: error.response?.data || null
    });
  }
});

/**
 * Inject fake multi-chain bridge transaction for testing
 * POST /api/intelligence/test-bridge
 * Body: {
 *   fromAddress: "0x...",
 *   toAddress: "0x...",
 *   fromChain: "eth",
 *   toChain: "polygon",
 *   value: "1.5",
 *   bridgeType: "Polygon Bridge"
 * }
 */
router.post('/test-bridge', async (req, res) => {
  try {
    const {
      fromAddress,
      toAddress,
      fromChain = 'eth',
      toChain = 'polygon',
      value = '1.0',
      bridgeType = 'Polygon Bridge'
    } = req.body;

    if (!fromAddress || !toAddress) {
      return res.status(400).json({ 
        error: 'fromAddress and toAddress are required' 
      });
    }

    if (!moralisService) {
      return res.status(503).json({ error: 'Moralis service not initialized' });
    }

    // Get bridge contract address for the from chain
    const bridgeContracts = moralisService.bridgeContracts[fromChain] || [];
    const bridgeContract = bridgeContracts[0] || '0x8484ef722627bf18ca5ae6bcf031c23e6e922b30'; // Default Polygon Bridge

    // Generate fake transaction hashes
    const generateHash = () => '0x' + Array.from({ length: 64 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');

    const { ethers } = require('ethers');
    const valueWei = ethers.parseEther(value.toString()).toString();
    const valueEth = ethers.formatEther(valueWei);
    const timestamp = new Date().toISOString();
    const blockNumber = Math.floor(Math.random() * 18000000) + 15000000; // Random recent block

    // Create transaction on source chain (fromAddress -> bridge contract)
    const sourceTx = {
      hash: generateHash(),
      from_address: fromAddress.toLowerCase(),
      to_address: bridgeContract.toLowerCase(),
      from: fromAddress.toLowerCase(),
      to: bridgeContract.toLowerCase(),
      value: valueWei,
      block_timestamp: timestamp,
      blockTimestamp: timestamp,
      block_number: blockNumber,
      blockNumber: blockNumber,
      chain: fromChain,
      isBridge: true,
      bridgeType: bridgeType,
      bridgeDestinationChain: toChain
    };

    // Create transaction on destination chain (bridge contract -> toAddress)
    const destTx = {
      hash: generateHash(),
      from_address: bridgeContract.toLowerCase(),
      to_address: toAddress.toLowerCase(),
      from: bridgeContract.toLowerCase(),
      to: toAddress.toLowerCase(),
      value: valueWei,
      block_timestamp: new Date(Date.now() + 60000).toISOString(), // 1 minute later
      blockTimestamp: new Date(Date.now() + 60000).toISOString(),
      block_number: Math.floor(Math.random() * 50000000) + 40000000, // Polygon block range
      blockNumber: Math.floor(Math.random() * 50000000) + 40000000,
      chain: toChain,
      isBridge: true,
      bridgeType: bridgeType,
      bridgeSourceChain: fromChain
    };

    // Store these transactions in a way that the trail system can access them
    // We'll need to modify the buildTransactionTrail to check for injected transactions
    // For now, return the transactions so they can be manually verified

    res.json({
      success: true,
      message: 'Fake multi-chain bridge transaction created',
      bridgeTransaction: {
        source: {
          chain: fromChain,
          transaction: sourceTx,
          description: `Transfer from ${fromAddress.substring(0, 10)}... to bridge on ${fromChain}`
        },
        destination: {
          chain: toChain,
          transaction: destTx,
          description: `Transfer from bridge to ${toAddress.substring(0, 10)}... on ${toChain}`
        },
        bridgeType: bridgeType,
        value: valueEth,
        valueWei: valueWei
      },
      instructions: {
        step1: `Check trail for ${fromAddress} on ${fromChain} chain`,
        step2: `Check trail for ${toAddress} on ${toChain} chain`,
        step3: 'Both transactions should show as bridge transactions',
        curlExample: `curl -X GET "http://localhost:5000/api/intelligence/${fromAddress}/trail?chain=${fromChain}&depth=3"`
      }
    });
  } catch (error) {
    console.error('Error creating fake bridge transaction:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to create fake bridge transaction',
      details: error.stack
    });
  }
});

/**
 * Inject fake transaction directly into trail system (for testing)
 * POST /api/intelligence/inject-transaction
 * Body: {
 *   from: "0x...",
 *   to: "0x...",
 *   chain: "eth",
 *   value: "1.0",
 *   isBridge: true,
 *   bridgeType: "Polygon Bridge",
 *   bridgeDestinationChain: "polygon"
 * }
 */
router.post('/inject-transaction', async (req, res) => {
  try {
    const {
      from,
      to,
      chain = 'eth',
      value = '1.0',
      isBridge = false,
      bridgeType = null,
      bridgeDestinationChain = null,
      bridgeSourceChain = null
    } = req.body;

    if (!from || !to) {
      return res.status(400).json({ 
        error: 'from and to addresses are required' 
      });
    }

    if (!moralisService) {
      return res.status(503).json({ error: 'Moralis service not initialized' });
    }

    // Generate fake transaction hash
    const generateHash = () => '0x' + Array.from({ length: 64 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');

    const { ethers } = require('ethers');
    const valueWei = ethers.parseEther(value.toString()).toString();
    const valueEth = ethers.formatEther(valueWei);
    const timestamp = new Date().toISOString();
    const blockNumber = Math.floor(Math.random() * 18000000) + 15000000;

    // Create transaction object matching Moralis format
    const transaction = {
      hash: generateHash(),
      from_address: from.toLowerCase(),
      to_address: to.toLowerCase(),
      from: from.toLowerCase(),
      to: to.toLowerCase(),
      value: valueWei,
      block_timestamp: timestamp,
      blockTimestamp: timestamp,
      block_number: blockNumber,
      blockNumber: blockNumber,
      chain: chain,
      isBridge: isBridge,
      bridgeType: bridgeType,
      bridgeDestinationChain: bridgeDestinationChain,
      bridgeSourceChain: bridgeSourceChain
    };

    // Store in a temporary cache that buildTransactionTrail can access
    if (!global.injectedTransactions) {
      global.injectedTransactions = new Map();
    }

    const addressKey = from.toLowerCase();
    if (!global.injectedTransactions.has(addressKey)) {
      global.injectedTransactions.set(addressKey, []);
    }
    global.injectedTransactions.get(addressKey).push(transaction);

    // Also store by destination address
    const toKey = to.toLowerCase();
    if (!global.injectedTransactions.has(toKey)) {
      global.injectedTransactions.set(toKey, []);
    }
    global.injectedTransactions.get(toKey).push(transaction);

    res.json({
      success: true,
      message: 'Transaction injected into trail system',
      transaction: transaction,
      note: 'This transaction will appear in trail queries for the addresses involved'
    });
  } catch (error) {
    console.error('Error injecting transaction:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to inject transaction',
      details: error.stack
    });
  }
});

module.exports = { router };

