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
 * Get recent transactions
 * GET /api/transactions?limit=50
 */
router.get('/', (req, res) => {
  try {
    if (!walletTracker) {
      return res.status(503).json({ error: 'Wallet tracker not initialized' });
    }

    const limit = parseInt(req.query.limit) || 50;
    const transactions = walletTracker.getTransactions(limit);
    res.json({ transactions, count: transactions.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get transactions for a specific address
 * GET /api/transactions/:address?limit=50
 */
router.get('/:address', (req, res) => {
  try {
    if (!walletTracker) {
      return res.status(503).json({ error: 'Wallet tracker not initialized' });
    }

    const { address } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    const transactions = walletTracker.getAddressTransactions(address, limit);
    res.json({ transactions, count: transactions.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get all activities (transactions, tokens, NFTs, etc.)
 * GET /api/transactions/activities?limit=100
 */
router.get('/activities/all', (req, res) => {
  try {
    if (!walletTracker) {
      return res.status(503).json({ error: 'Wallet tracker not initialized' });
    }

    const limit = parseInt(req.query.limit) || 100;
    const activities = walletTracker.getActivities(limit);
    res.json({ activities, count: activities.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Simulate a test transaction (for testing/demo purposes)
 * POST /api/transactions/test
 * Body: { from?: "0x...", to?: "0x...", value?: "1.0", type?: "eth" | "token" | "nft" }
 */
router.post('/test', async (req, res) => {
  try {
    if (!walletTracker) {
      return res.status(503).json({ error: 'Wallet tracker not initialized' });
    }

    const { from, to, value, type = 'eth' } = req.body;
    
    // Get tracked addresses to use if from/to not provided
    const tracked = walletTracker.getTrackedAddresses();
    const trackedAddresses = tracked.addresses || [];
    
    if (trackedAddresses.length === 0) {
      return res.status(400).json({ 
        error: 'No tracked addresses. Add an address first using POST /api/track/address' 
      });
    }

    // Generate random hash
    const randomHash = '0x' + Array.from({ length: 64 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');

    // Use provided addresses or pick from tracked addresses
    const fromAddress = from || trackedAddresses[0];
    const toAddress = to || (trackedAddresses.length > 1 ? trackedAddresses[1] : '0x0000000000000000000000000000000000000000');
    
    // Check if addresses are tracked
    const fromTracked = trackedAddresses.includes(fromAddress.toLowerCase());
    const toTracked = trackedAddresses.includes(toAddress.toLowerCase());
    
    // Convert value to wei (if provided as ETH)
    const { ethers } = require('ethers');
    const valueWei = value ? ethers.parseEther(value.toString()).toString() : '1000000000000000000'; // 1 ETH default
    const valueEth = ethers.formatEther(valueWei);

    // Get current block
    const currentBlock = await walletTracker.getCurrentBlock();

    // Create transaction data based on type
    let activities = [];
    let txData = {
      type: 'TRANSACTION',
      hash: randomHash,
      from: fromAddress,
      to: toAddress,
      value: valueWei,
      valueEth: valueEth,
      blockNumber: currentBlock + 1,
      blockTimestamp: new Date().toISOString(),
      gasUsed: '21000',
      gasPrice: '20000000000',
      status: 'success',
      chain: walletTracker.chainName,
      fromTracked,
      toTracked,
      contractTracked: false,
      activityType: fromTracked ? 'outgoing' : (toTracked ? 'incoming' : 'unknown'),
      trackedAddress: fromTracked ? fromAddress : (toTracked ? toAddress : null),
      inputData: null
    };

    // Add activities based on type
    if (type === 'token') {
      activities.push({
        type: 'TOKEN_TRANSFER',
        standard: 'ERC20',
        contract: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC contract
        from: fromAddress,
        to: toAddress,
        value: '1000000', // 1 USDC (6 decimals)
        transactionHash: randomHash
      });
    } else if (type === 'nft') {
      activities.push({
        type: 'NFT_TRANSFER',
        standard: 'ERC721',
        contract: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D', // BAYC contract
        from: fromAddress,
        to: toAddress,
        tokenId: Math.floor(Math.random() * 10000).toString(),
        transactionHash: randomHash
      });
    } else {
      // ETH transfer
      activities.push({
        type: 'ETH_TRANSFER',
        from: fromAddress,
        to: toAddress,
        value: valueWei,
        valueEth: valueEth
      });
    }

    // Create activity record
    const activityRecord = {
      ...txData,
      activities,
      timestamp: new Date().toISOString()
    };

    // Simulate balance change if address is tracked
    if (fromTracked || toTracked) {
      const balanceChange = {
        address: fromTracked ? fromAddress : toAddress,
        balanceBefore: '5000000000000000000', // 5 ETH
        balanceAfter: fromTracked ? '4000000000000000000' : '6000000000000000000', // 4 ETH or 6 ETH
        balanceDelta: fromTracked ? '-1000000000000000000' : '1000000000000000000',
        balanceDeltaEth: fromTracked ? '-1.0' : '1.0'
      };
      activityRecord.balanceChange = balanceChange;
    }

    // Store the transaction in walletTracker's storage
    walletTracker.transactions.unshift(activityRecord);
    walletTracker.activities.unshift(activityRecord);
    
    // Keep storage limited
    if (walletTracker.transactions.length > walletTracker.maxStorage) {
      walletTracker.transactions = walletTracker.transactions.slice(0, walletTracker.maxStorage);
    }
    if (walletTracker.activities.length > walletTracker.maxStorage) {
      walletTracker.activities = walletTracker.activities.slice(0, walletTracker.maxStorage);
    }

    // Broadcast to WebSocket clients
    if (global.broadcastWalletUpdate) {
      global.broadcastWalletUpdate({
        type: 'ACTIVITY',
        chain: walletTracker.chainName,
        data: activityRecord
      });
    }

    // Send webhook if configured
    const trackedAddress = activityRecord.trackedAddress;
    if (trackedAddress) {
      await walletTracker.sendWebhook(trackedAddress, activityRecord);
    }

    // Add to transaction trail
    if (transactionTrail) {
      transactionTrail.addTransaction(activityRecord);
    }

    res.json({ 
      success: true, 
      message: 'Test transaction created and broadcasted',
      transaction: activityRecord
    });
  } catch (error) {
    console.error('Error creating test transaction:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = { router, setWalletTracker, setTransactionTrail };

