const { ethers } = require('ethers');

/**
 * Core Blockchain Monitor Service
 * Monitors blockchain blocks and transactions in real-time
 */
class BlockchainMonitor {
  constructor(rpcUrl, wsUrl = null, chainName = 'ethereum') {
    this.chainName = chainName;
    
    // HTTP Provider for polling
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    
    // WebSocket Provider for real-time (if available)
    this.wsProvider = wsUrl ? new ethers.WebSocketProvider(wsUrl) : null;
    
    this.isRunning = false;
    this.lastBlockNumber = null;
    this.trackedAddresses = new Set(); // Tracked wallet addresses
    this.trackedContracts = new Set(); // Tracked contract addresses
    
    // Callbacks
    this.onTransactionCallback = null;
    this.onBlockCallback = null;
  }

  /**
   * Add address to track (wallet or contract)
   */
  addAddress(address) {
    const normalized = address.toLowerCase();
    this.trackedAddresses.add(normalized);
    console.log(`✅ Tracking address: ${normalized} on ${this.chainName}`);
    return true;
  }

  /**
   * Add contract address to track
   */
  addContract(address) {
    const normalized = address.toLowerCase();
    this.trackedContracts.add(normalized);
    this.trackedAddresses.add(normalized); // Also track as regular address
    console.log(`✅ Tracking contract: ${normalized} on ${this.chainName}`);
    return true;
  }

  /**
   * Remove address from tracking
   */
  removeAddress(address) {
    const normalized = address.toLowerCase();
    this.trackedAddresses.delete(normalized);
    this.trackedContracts.delete(normalized);
    console.log(`❌ Stopped tracking: ${normalized}`);
  }

  /**
   * Get all tracked addresses
   */
  getTrackedAddresses() {
    return {
      addresses: Array.from(this.trackedAddresses),
      contracts: Array.from(this.trackedContracts)
    };
  }

  /**
   * Check if address is tracked
   */
  isTracked(address) {
    return this.trackedAddresses.has(address?.toLowerCase());
  }

  /**
   * Set callback for new transactions
   */
  setTransactionCallback(callback) {
    this.onTransactionCallback = callback;
  }

  /**
   * Set callback for new blocks
   */
  setBlockCallback(callback) {
    this.onBlockCallback = callback;
  }

  /**
   * Start monitoring using WebSocket (real-time)
   */
  async startWebSocketMonitoring() {
    if (!this.wsProvider) {
      console.log(`⚠️  WebSocket not available for ${this.chainName}, using polling`);
      return this.startPolling();
    }

    console.log(`🔌 Starting WebSocket monitoring for ${this.chainName}...`);
    this.isRunning = true;

    // Listen for new blocks
    this.wsProvider.on('block', async (blockNumber) => {
      try {
        await this.processBlock(blockNumber);
      } catch (error) {
        console.error(`Error processing block ${blockNumber}:`, error);
      }
    });

    // Handle connection errors
    this.wsProvider._websocket.on('error', (error) => {
      console.error(`WebSocket error on ${this.chainName}:`, error);
      this.startPolling(); // Fallback to polling
    });

    this.wsProvider._websocket.on('close', () => {
      console.log(`WebSocket closed for ${this.chainName}, reconnecting...`);
      setTimeout(() => this.startWebSocketMonitoring(), 5000);
    });

    // Get initial block number
    this.lastBlockNumber = await this.provider.getBlockNumber();
    console.log(`📍 ${this.chainName} monitoring from block: ${this.lastBlockNumber}`);
  }

  /**
   * Start monitoring using polling (fallback)
   */
  async startPolling() {
    if (this.isRunning && this.wsProvider) return;

    console.log(`🔄 Starting block polling for ${this.chainName}...`);
    this.isRunning = true;

    // Get current block number
    if (!this.lastBlockNumber) {
      this.lastBlockNumber = await this.provider.getBlockNumber();
      console.log(`📍 ${this.chainName} starting from block: ${this.lastBlockNumber}`);
    }

    const pollInterval = 12000; // 12 seconds (Ethereum block time)

    const poll = async () => {
      if (!this.isRunning) return;

      try {
        const currentBlock = await this.provider.getBlockNumber();
        
        if (currentBlock > this.lastBlockNumber) {
          console.log(`📦 ${this.chainName}: New blocks ${this.lastBlockNumber + 1} to ${currentBlock}`);
          
          // Process all new blocks
          for (let blockNum = this.lastBlockNumber + 1; blockNum <= currentBlock; blockNum++) {
            await this.processBlock(blockNum);
          }
          
          this.lastBlockNumber = currentBlock;
        }
      } catch (error) {
        console.error(`Polling error on ${this.chainName}:`, error);
      }

      setTimeout(poll, pollInterval);
    };

    poll();
  }

  /**
   * Process a single block
   */
  async processBlock(blockNumber) {
    try {
      const block = await this.provider.getBlock(blockNumber, true); // true = include transactions
      
      if (!block || !block.transactions) {
        return;
      }

      // Notify block callback
      if (this.onBlockCallback) {
        this.onBlockCallback({
          chain: this.chainName,
          blockNumber: block.number,
          timestamp: new Date(block.timestamp * 1000).toISOString(),
          transactionCount: block.transactions.length
        });
      }

      // Check each transaction in the block
      for (const tx of block.transactions) {
        await this.checkTransaction(tx, block);
      }
    } catch (error) {
      console.error(`Error processing block ${blockNumber} on ${this.chainName}:`, error);
    }
  }

  /**
   * Check if transaction involves tracked addresses
   */
  async checkTransaction(tx, block) {
    try {
      const from = tx.from?.toLowerCase();
      const to = tx.to?.toLowerCase();
      
      const fromTracked = from && this.isTracked(from);
      const toTracked = to && this.isTracked(to);
      const contractTracked = to && this.trackedContracts.has(to);

      // If transaction involves any tracked address
      if (fromTracked || toTracked || contractTracked) {
        // Get full transaction details
        const receipt = await this.provider.getTransactionReceipt(tx.hash);
        
        // Determine activity type
        let activityType = 'unknown';
        if (fromTracked && toTracked) {
          activityType = 'self';
        } else if (fromTracked) {
          activityType = 'outgoing';
        } else if (toTracked) {
          activityType = 'incoming';
        } else if (contractTracked) {
          activityType = 'contract_interaction';
        }

        const transactionData = {
          type: 'TRANSACTION',
          hash: tx.hash,
          from: tx.from,
          to: tx.to,
          value: tx.value.toString(),
          valueEth: ethers.formatEther(tx.value || '0'),
          blockNumber: block.number,
          blockTimestamp: new Date(block.timestamp * 1000).toISOString(),
          gasUsed: receipt?.gasUsed?.toString() || '0',
          gasPrice: tx.gasPrice?.toString() || '0',
          status: receipt?.status === 1 ? 'success' : 'failed',
          chain: this.chainName,
          fromTracked,
          toTracked,
          contractTracked,
          activityType,
          trackedAddress: fromTracked ? from : (toTracked ? to : (contractTracked ? to : null)),
          inputData: tx.data !== '0x' ? tx.data : null
        };

        // Callback to notify
        if (this.onTransactionCallback) {
          await this.onTransactionCallback(transactionData, receipt);
        }
      }
    } catch (error) {
      console.error(`Error checking transaction ${tx.hash}:`, error);
    }
  }

  /**
   * Stop monitoring
   */
  stop() {
    this.isRunning = false;
    if (this.wsProvider) {
      this.wsProvider.destroy();
    }
    console.log(`⏹️  Monitoring stopped for ${this.chainName}`);
  }

  /**
   * Get current block number
   */
  async getCurrentBlock() {
    return await this.provider.getBlockNumber();
  }
}

module.exports = BlockchainMonitor;

