const BlockchainMonitor = require('./blockchainMonitor');
const TransactionAnalyzer = require('./transactionAnalyzer');
const BalanceTracker = require('./balanceTracker');

/**
 * Main Wallet Tracker Service
 * Orchestrates all monitoring components
 */
class WalletTracker {
  constructor(rpcUrl, wsUrl = null, chainName = 'ethereum') {
    this.chainName = chainName;
    
    // Initialize components
    this.monitor = new BlockchainMonitor(rpcUrl, wsUrl, chainName);
    this.analyzer = new TransactionAnalyzer(this.monitor.provider);
    this.balanceTracker = new BalanceTracker(this.monitor.provider);
    
    // Storage
    this.transactions = []; // Recent transactions
    this.activities = []; // All activities (transactions, tokens, NFTs, etc.)
    this.maxStorage = 10000; // Keep last 10k items
    
    // Webhook configurations: address -> { url, secret, enabled }
    this.webhookConfigs = new Map();
    
    // Set up callbacks
    this.setupCallbacks();
  }

  /**
   * Setup callbacks for blockchain monitor
   */
  setupCallbacks() {
    this.monitor.setTransactionCallback(async (txData, receipt) => {
      await this.handleTransaction(txData, receipt);
    });

    this.monitor.setBlockCallback((blockData) => {
      this.handleBlock(blockData);
    });
  }

  /**
   * Handle new transaction
   */
  async handleTransaction(txData, receipt) {
    try {
      // Analyze transaction for all activities
      const activities = await this.analyzer.analyzeTransaction(txData, receipt);
      
      // Track balance changes
      const trackedAddress = txData.trackedAddress;
      if (trackedAddress) {
        const balanceChange = await this.balanceTracker.trackBalanceChange(
          trackedAddress,
          txData,
          receipt
        );
        txData.balanceChange = balanceChange;
      }

      // Create comprehensive activity record
      const activityRecord = {
        ...txData,
        activities,
        timestamp: new Date().toISOString()
      };

      // Store
      this.transactions.unshift(activityRecord);
      this.activities.unshift(activityRecord);
      
      // Keep storage limited
      if (this.transactions.length > this.maxStorage) {
        this.transactions = this.transactions.slice(0, this.maxStorage);
      }
      if (this.activities.length > this.maxStorage) {
        this.activities = this.activities.slice(0, this.maxStorage);
      }

      // Broadcast to WebSocket clients
      if (global.broadcastWalletUpdate) {
        global.broadcastWalletUpdate({
          type: 'ACTIVITY',
          chain: this.chainName,
          data: activityRecord
        });
      }

      // Send webhook if configured
      if (trackedAddress) {
        await this.sendWebhook(trackedAddress, activityRecord);
      }

      console.log(`📊 Activity detected on ${this.chainName}:`, {
        hash: txData.hash,
        type: txData.activityType,
        from: txData.from?.substring(0, 10) + '...',
        to: txData.to?.substring(0, 10) + '...',
        activities: activities.length
      });
    } catch (error) {
      console.error('Error handling transaction:', error);
    }
  }

  /**
   * Handle new block
   */
  handleBlock(blockData) {
    // Broadcast block update
    if (global.broadcastWalletUpdate) {
      global.broadcastWalletUpdate({
        type: 'BLOCK',
        chain: this.chainName,
        data: blockData
      });
    }
  }

  /**
   * Send webhook notification
   */
  async sendWebhook(address, activityRecord) {
    const normalized = address.toLowerCase();
    const config = this.webhookConfigs.get(normalized);
    
    if (!config || !config.enabled || !config.url) {
      return;
    }

    try {
      const axios = require('axios');
      
      const payload = {
        event: 'ADDRESS_ACTIVITY',
        chain: this.chainName,
        address: address,
        activity: [activityRecord],
        timestamp: new Date().toISOString()
      };

      // Add signature if secret is configured
      if (config.secret) {
        const crypto = require('crypto');
        const signature = crypto
          .createHmac('sha256', config.secret)
          .update(JSON.stringify(payload))
          .digest('hex');
        payload.signature = signature;
      }

      await axios.post(config.url, payload, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Blockchain-Monitor/1.0'
        },
        timeout: 10000 // 10 second timeout
      });

      console.log(`✅ Webhook sent to ${config.url} for ${address}`);
    } catch (error) {
      console.error(`❌ Webhook failed for ${address}:`, error.message);
      // In production, implement retry queue here
    }
  }

  /**
   * Initialize and start monitoring
   */
  async initialize() {
    // Initialize balances for all tracked addresses
    const tracked = this.monitor.getTrackedAddresses();
    for (const address of tracked.addresses) {
      await this.balanceTracker.initializeBalance(address);
    }

    // Start monitoring
    if (this.monitor.wsProvider) {
      await this.monitor.startWebSocketMonitoring();
    } else {
      await this.monitor.startPolling();
    }

    console.log(`🚀 Wallet tracker initialized for ${this.chainName}`);
  }

  /**
   * Add address to track
   */
  async addAddress(address) {
    this.monitor.addAddress(address);
    await this.balanceTracker.initializeBalance(address);
  }

  /**
   * Add contract to track
   */
  addContract(address) {
    this.monitor.addContract(address);
  }

  /**
   * Remove address from tracking
   */
  removeAddress(address) {
    this.monitor.removeAddress(address);
    this.webhookConfigs.delete(address.toLowerCase());
  }

  /**
   * Get tracked addresses
   */
  getTrackedAddresses() {
    return this.monitor.getTrackedAddresses();
  }

  /**
   * Configure webhook for an address
   */
  configureWebhook(address, webhookUrl, secret = null) {
    const normalized = address.toLowerCase();
    this.webhookConfigs.set(normalized, {
      url: webhookUrl,
      secret: secret,
      enabled: true
    });
    console.log(`🔔 Webhook configured for ${address}: ${webhookUrl}`);
  }

  /**
   * Get webhook configuration
   */
  getWebhookConfig(address) {
    return this.webhookConfigs.get(address.toLowerCase());
  }

  /**
   * Get recent transactions
   */
  getTransactions(limit = 50) {
    return this.transactions.slice(0, limit);
  }

  /**
   * Get transactions for a specific address
   */
  getAddressTransactions(address, limit = 50) {
    const normalized = address.toLowerCase();
    return this.transactions
      .filter(tx => 
        tx.from?.toLowerCase() === normalized || 
        tx.to?.toLowerCase() === normalized ||
        tx.trackedAddress?.toLowerCase() === normalized
      )
      .slice(0, limit);
  }

  /**
   * Get all activities (transactions, tokens, NFTs, etc.)
   */
  getActivities(limit = 100) {
    return this.activities.slice(0, limit);
  }

  /**
   * Get current block number
   */
  async getCurrentBlock() {
    return await this.monitor.getCurrentBlock();
  }
}

module.exports = WalletTracker;

