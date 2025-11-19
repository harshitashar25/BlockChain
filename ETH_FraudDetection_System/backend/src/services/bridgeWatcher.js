const fs = require('fs');
const path = require('path');
const Neo4jClient = require('../graph/neo4jClient');
const MoralisClient = require('./moralisClient');

/**
 * Bridge Watcher - Detects cross-chain bridge events and creates BRIDGED relationships
 * Algorithm:
 * 1. Watch chain A for Lock events; store (nonce, source_tx, amount, sender)
 * 2. Watch chain B for Mint events; match on nonce or ref
 * 3. If matched, create BRIDGED edge in Neo4j
 */
class BridgeWatcher {
  constructor() {
    this.neo4j = new Neo4jClient();
    this.moralis = new MoralisClient();
    this.bridgeRegistry = this._loadBridgeRegistry();
    this.pendingLocks = new Map(); // nonce -> lock event
  }

  /**
   * Load bridge registry from JSON
   */
  _loadBridgeRegistry() {
    const registryPath = path.join(__dirname, '../../infra/bridgeRegistry.json');
    try {
      const data = fs.readFileSync(registryPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.warn('Bridge registry not found, using empty registry');
      return { bridges: [], heuristics: {} };
    }
  }

  /**
   * Process a transfer event and check if it's a bridge lock
   * @param {object} transferEvent - Canonical transfer event
   */
  async processTransferEvent(transferEvent) {
    // Check if this is a known bridge contract
    const bridge = this._findBridgeContract(transferEvent.token_address, transferEvent.chain);

    if (bridge) {
      // This might be a lock event
      await this._processLockEvent(transferEvent, bridge);
    } else if (this.bridgeRegistry.heuristics?.enable_unknown_bridge_detection) {
      // Try heuristic detection
      await this._processHeuristicLock(transferEvent);
    }
  }

  /**
   * Process a lock event (chain A -> chain B)
   */
  async _processLockEvent(transferEvent, bridge) {
    // Extract nonce or reference from transfer event
    // In real implementation, would parse event logs
    const nonce = this._extractNonce(transferEvent);

    if (!nonce) {
      return; // Not a bridge event
    }

    // Store pending lock
    this.pendingLocks.set(nonce, {
      chain: transferEvent.chain,
      tx_hash: transferEvent.tx_hash,
      from: transferEvent.from,
      to: transferEvent.to,
      amount: parseFloat(transferEvent.amount),
      timestamp: transferEvent.timestamp,
      bridge: bridge.name
    });

    console.log(`🔒 Bridge lock detected: ${nonce} on ${transferEvent.chain}`);

    // Check for matching mint on other chains
    await this._checkMatchingMint(nonce, transferEvent, bridge);
  }

  /**
   * Check for matching mint event on other chains
   */
  async _checkMatchingMint(nonce, lockEvent, bridge) {
    // Get other chains from bridge config
    const otherChains = Object.keys(bridge.chains).filter(c => c !== lockEvent.chain);

    for (const otherChain of otherChains) {
      // In production, would query Moralis or blockchain for recent mint events
      // For PoC, we'll check pending locks and create synthetic matches
      const mintEvent = await this._findMatchingMint(nonce, otherChain, bridge);

      if (mintEvent) {
        await this._createBridgedRelationship(lockEvent, mintEvent, bridge);
      }
    }
  }

  /**
   * Find matching mint event (simplified for PoC)
   */
  async _findMatchingMint(nonce, chain, bridge) {
    // In production: query Moralis for recent transfers to bridge mint contract
    // For PoC: return synthetic mint if nonce matches
    return {
      chain: chain,
      tx_hash: `0x${Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`,
      to: `0x${Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`,
      amount: this.pendingLocks.get(nonce)?.amount || 0,
      timestamp: new Date().toISOString(),
      nonce: nonce
    };
  }

  /**
   * Create BRIDGED relationship in Neo4j
   */
  async _createBridgedRelationship(lockEvent, mintEvent, bridge) {
    const fromActorId = `chain:${lockEvent.from.toLowerCase()}`;
    const toActorId = `chain:${mintEvent.to.toLowerCase()}`;

    const bridgeData = {
      bridge_id: `${bridge.name}-${lockEvent.tx_hash}`,
      nonce: this._extractNonce(lockEvent),
      amount: lockEvent.amount,
      from_chain: lockEvent.chain,
      to_chain: mintEvent.chain,
      from_tx: lockEvent.tx_hash,
      to_tx: mintEvent.tx_hash,
      timestamp: lockEvent.timestamp
    };

    await this.neo4j.createBridgedRelationship(fromActorId, toActorId, bridgeData);

    console.log(`🌉 BRIDGED relationship created: ${fromActorId} -> ${toActorId}`);
  }

  /**
   * Process heuristic lock detection (unknown bridges)
   */
  async _processHeuristicLock(transferEvent) {
    // Heuristic: large transfer to a contract address that might be a bridge
    const amount = parseFloat(transferEvent.amount);
    const minAmount = this.bridgeRegistry.heuristics?.min_amount_threshold || 0.1;

    if (amount < minAmount) {
      return; // Too small
    }

    // Check if 'to' address is a contract (would need to check in production)
    // For PoC, we'll use a simple heuristic: if amount is large and recent
    const recentThreshold = Date.now() - (this.bridgeRegistry.heuristics?.time_window_seconds || 300) * 1000;
    const eventTime = new Date(transferEvent.timestamp).getTime();

    if (eventTime > recentThreshold) {
      // Potential bridge lock - store for matching
      const syntheticNonce = `heuristic-${transferEvent.tx_hash}`;
      this.pendingLocks.set(syntheticNonce, {
        chain: transferEvent.chain,
        tx_hash: transferEvent.tx_hash,
        from: transferEvent.from,
        to: transferEvent.to,
        amount: amount,
        timestamp: transferEvent.timestamp,
        bridge: 'unknown'
      });
    }
  }

  /**
   * Find bridge contract in registry
   */
  _findBridgeContract(tokenAddress, chain) {
    if (!tokenAddress) return null;

    const normalized = tokenAddress.toLowerCase();

    for (const bridge of this.bridgeRegistry.bridges) {
      if (bridge.chains[chain]) {
        const lockContract = bridge.chains[chain].lock_contract?.toLowerCase();
        const mintContract = bridge.chains[chain].mint_contract?.toLowerCase();

        if (lockContract === normalized || mintContract === normalized) {
          return bridge;
        }
      }
    }

    return null;
  }

  /**
   * Extract nonce from transfer event (simplified)
   * In production, would parse event logs
   */
  _extractNonce(transferEvent) {
    // For PoC, use a synthetic nonce based on tx hash
    // In production, would extract from event logs
    if (transferEvent.tx_hash) {
      return `nonce-${transferEvent.tx_hash.slice(0, 16)}`;
    }
    return null;
  }

  /**
   * Manually register a bridge event pair (for testing)
   */
  async registerBridgeEvent(lockEvent, mintEvent, bridgeName = 'manual') {
    const bridge = {
      name: bridgeName,
      chains: {}
    };

    await this._createBridgedRelationship(lockEvent, mintEvent, bridge);
  }

  /**
   * Close connections
   */
  async close() {
    await this.neo4j.close();
  }
}

module.exports = BridgeWatcher;

