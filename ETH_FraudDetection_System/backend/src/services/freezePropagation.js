const axios = require('axios');
const BankHoldService = require('./bankHoldService');
const { getSharedGraph } = require('../graph/sharedMemoryGraph');
require('dotenv').config();

/**
 * Freeze Propagation Service
 * Automatically propagates freeze requests to all connected banks, exchanges, and wallets
 * Uses graph-based cascading to freeze all connected nodes
 */
class FreezePropagationService {
  constructor() {
    this.bankHoldService = new BankHoldService();
    
    // List of connected banks (in production, this would come from config/DB)
    this.connectedBanks = [
      { id: 'bank-001', url: process.env.BANK_1_URL || 'http://localhost:4001', name: 'Bank A (HDFC)' },
      { id: 'bank-002', url: process.env.BANK_2_URL || 'http://localhost:4001', name: 'Bank B (ICICI)' },
      { id: 'bank-003', url: process.env.BANK_3_URL || 'http://localhost:4001', name: 'Bank C (SBI)' }
    ];

    // Exchange endpoints (in production, from config)
    this.connectedExchanges = [
      { id: 'exchange-001', url: process.env.EXCHANGE_1_URL || 'http://localhost:4002', name: 'Binance' },
      { id: 'exchange-002', url: process.env.EXCHANGE_2_URL || 'http://localhost:4002', name: 'Coinbase' }
    ];
  }

  /**
   * Propagate freeze to all connected banks, exchanges, and wallets
   * @param {string} caseId - Case ID
   * @param {Array<string>} assetRefs - Asset references to freeze
   * @param {string} evidenceHash - Evidence hash
   * @returns {Promise<object>} Propagation results
   */
  async propagateFreeze(caseId, assetRefs, evidenceHash) {
    const results = {
      case_id: caseId,
      timestamp: new Date().toISOString(),
      banks: { total: this.connectedBanks.length, successful: [], failed: [] },
      exchanges: { total: this.connectedExchanges.length, successful: [], failed: [] },
      wallets: { total: 0, successful: [], failed: [] }
    };

    console.log(`🔄 Propagating freeze for case ${caseId}...`);

    // Step A: Freeze bank accounts
    await this._freezeBanks(caseId, assetRefs, evidenceHash, results);

    // Step B: Freeze exchange accounts
    await this._freezeExchanges(caseId, assetRefs, evidenceHash, results);

    // Step C: Freeze wallet addresses (graph-based cascading)
    await this._freezeWallets(caseId, assetRefs, evidenceHash, results);

    console.log(`✅ Freeze propagation complete:`);
    console.log(`   Banks: ${results.banks.successful.length}/${results.banks.total} successful`);
    console.log(`   Exchanges: ${results.exchanges.successful.length}/${results.exchanges.total} successful`);
    console.log(`   Wallets: ${results.wallets.successful.length} frozen`);

    return results;
  }

  /**
   * Freeze bank accounts
   * @private
   */
  async _freezeBanks(caseId, assetRefs, evidenceHash, results) {
    const promises = this.connectedBanks.map(async (bank) => {
      try {
        const holdResults = [];
        
        // Freeze each asset reference
        for (const assetRef of assetRefs) {
          try {
            // Only freeze bank accounts (not wallets)
            if (assetRef.startsWith('bank:') || assetRef.includes('account')) {
              const holdResult = await this.bankHoldService.placeHold(
                caseId,
                assetRef,
                evidenceHash
              );
              holdResults.push(holdResult);
              console.log(`  ✅ Hold placed at ${bank.name}: ${holdResult.hold_id}`);
            }
          } catch (error) {
            console.error(`  ❌ Failed to place hold at ${bank.name} for ${assetRef}:`, error.message);
          }
        }

        results.banks.successful.push({
          bank_id: bank.id,
          bank_name: bank.name,
          holds: holdResults
        });
      } catch (error) {
        console.error(`  ❌ Failed to propagate to ${bank.name}:`, error.message);
        results.banks.failed.push({
          bank_id: bank.id,
          bank_name: bank.name,
          error: error.message
        });
      }
    });

    await Promise.allSettled(promises);
  }

  /**
   * Freeze exchange accounts
   * @private
   */
  async _freezeExchanges(caseId, assetRefs, evidenceHash, results) {
    const promises = this.connectedExchanges.map(async (exchange) => {
      try {
        // Find exchange account tokens from asset refs
        const exchangeRefs = assetRefs.filter(ref => 
          ref.startsWith('exchange:') || ref.includes('EXCHANGE_TOKEN')
        );

        for (const exchangeRef of exchangeRefs) {
          try {
            const response = await axios.post(`${exchange.url}/api/exchange/freeze`, {
              caseId: caseId,
              exchangeAccountToken: exchangeRef,
              evidenceHash: evidenceHash
            }, {
              headers: { 'X-API-Key': process.env.MOCK_EXCHANGE_API_KEY || 'mock_key' }
            });

            results.exchanges.successful.push({
              exchange_id: exchange.id,
              exchange_name: exchange.name,
              account_token: exchangeRef,
              freeze_id: response.data.freeze_id
            });
            console.log(`  ✅ Exchange account frozen at ${exchange.name}: ${exchangeRef}`);
          } catch (error) {
            console.error(`  ❌ Failed to freeze exchange account at ${exchange.name}:`, error.message);
            results.exchanges.failed.push({
              exchange_id: exchange.id,
              exchange_name: exchange.name,
              account_token: exchangeRef,
              error: error.message
            });
          }
        }
      } catch (error) {
        console.error(`  ❌ Failed to propagate to ${exchange.name}:`, error.message);
      }
    });

    await Promise.allSettled(promises);
  }

  /**
   * Freeze wallet addresses using graph-based cascading
   * @private
   */
  async _freezeWallets(caseId, assetRefs, evidenceHash, results) {
    try {
      const USE_MEMORY = process.env.USE_MEMORY_GRAPH === 'true' || !process.env.NEO4J_URI;
      const graph = USE_MEMORY ? getSharedGraph() : require('../graph/neo4jClient');

      // Find all wallet addresses in asset refs
      const walletAddresses = assetRefs.filter(ref => 
        ref.startsWith('chain:') || ref.startsWith('0x')
      );

      // For each wallet, find connected nodes within depth 3
      const allWalletsToFreeze = new Set(walletAddresses);

      for (const walletAddr of walletAddresses) {
        const normalizedAddr = walletAddr.startsWith('chain:') ? walletAddr : `chain:${walletAddr}`;
        
        try {
          // Get all nodes within depth 3
          const connectedNodes = await this._getConnectedNodes(graph, normalizedAddr, 3);
          connectedNodes.forEach(node => allWalletsToFreeze.add(node));
        } catch (error) {
          console.error(`  ⚠️  Could not get connected nodes for ${walletAddr}:`, error.message);
        }
      }

      results.wallets.total = allWalletsToFreeze.size;

      // Freeze each wallet (in production, this would call blockchain enforcement partners)
      for (const walletAddr of allWalletsToFreeze) {
        try {
          // For PoC, we'll just log it
          // In production, this would call wallet freeze API
          console.log(`  🔒 Wallet frozen: ${walletAddr}`);
          results.wallets.successful.push({
            wallet: walletAddr,
            freeze_id: `FREEZE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          });
        } catch (error) {
          results.wallets.failed.push({
            wallet: walletAddr,
            error: error.message
          });
        }
      }
    } catch (error) {
      console.error('Error freezing wallets:', error);
    }
  }

  /**
   * Get all connected nodes within specified depth
   * @private
   */
  async _getConnectedNodes(graph, seedNode, depth) {
    const connected = new Set([seedNode]);
    const queue = [{ node: seedNode, depth: 0 }];
    const visited = new Set([seedNode]);

    while (queue.length > 0) {
      const { node, depth: currentDepth } = queue.shift();

      if (currentDepth >= depth) continue;

      try {
        // Get outgoing relationships
        const relationships = await graph.getOutgoingRelationships(
          node,
          new Date(0), // No time filter
          0 // No amount filter
        );

        for (const rel of relationships) {
          const nextNode = rel.to;
          if (!visited.has(nextNode)) {
            visited.add(nextNode);
            connected.add(nextNode);
            queue.push({ node: nextNode, depth: currentDepth + 1 });
          }
        }
      } catch (error) {
        console.error(`Error getting relationships for ${node}:`, error.message);
      }
    }

    return Array.from(connected);
  }

  /**
   * Get freeze status across all banks
   * @param {string} caseId - Case ID
   * @returns {Promise<object>} Status across all banks
   */
  async getFreezeStatus(caseId) {
    const status = {
      case_id: caseId,
      timestamp: new Date().toISOString(),
      banks: [],
      exchanges: [],
      wallets: []
    };

    // Query each bank for holds
    for (const bank of this.connectedBanks) {
      try {
        const response = await axios.get(`${bank.url}/api/bank/hold/case/${caseId}`, {
          headers: { 'X-API-Key': process.env.MOCK_BANK_API_KEY || 'mock_bank_key' }
        }).catch(() => ({ data: { holds: [] } }));

        status.banks.push({
          bank_id: bank.id,
          bank_name: bank.name,
          holds: response.data.holds || [],
          status: response.data.holds.length > 0 ? 'ACTIVE' : 'NONE'
        });
      } catch (error) {
        status.banks.push({
          bank_id: bank.id,
          bank_name: bank.name,
          status: 'ERROR',
          error: error.message
        });
      }
    }

    return status;
  }
}

module.exports = FreezePropagationService;

