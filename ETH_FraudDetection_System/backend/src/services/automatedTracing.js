const axios = require('axios');
const MoralisClient = require('./moralisClient');
const Neo4jClient = require('../graph/neo4jClient');
const { getSharedGraph } = require('../graph/sharedMemoryGraph');
const Tracer = require('../tracer/tracer');
require('dotenv').config();

/**
 * Automated Tracing Service
 * Automates the complete flow: Bank UTR → Exchange P2P → Wallet → Blockchain Trail
 */
class AutomatedTracingService {
  constructor() {
    this.moralisClient = new MoralisClient();
    this.bankUrl = process.env.MOCK_BANK_URL || 'http://localhost:4001';
    this.exchangeUrl = process.env.MOCK_EXCHANGE_URL || 'http://localhost:4002';
  }

  /**
   * Complete automated trace from UTR
   * @param {string} utr - UTR number
   * @param {object} options - Tracing options
   * @returns {Promise<object>} Complete trace results
   */
  async traceFromUTR(utr, options = {}) {
    const {
      chain = 'eth',
      depth = 6,
      hours = 168,
      minAmt = 0.01
    } = options;

    const traceResult = {
      utr: utr,
      timestamp: new Date().toISOString(),
      steps: {
        bank: null,
        exchange: null,
        wallet: null,
        blockchain: null
      },
      graph: {
        nodes: [],
        edges: [],
        paths: []
      },
      errors: []
    };

    try {
      // Step 1: Query Bank Adapter for UTR details
      console.log(`📋 Step 1: Fetching UTR details from bank...`);
      const bankResponse = await axios.get(`${this.bankUrl}/api/bank/utr/${utr}`);
      const bankData = bankResponse.data.payload;
      
      traceResult.steps.bank = {
        utr: bankData.utr,
        remitter: bankData.remitter,
        amount: bankData.amount,
        currency: bankData.currency,
        account_hash: bankData.remitter.account_hash
      };

      console.log(`✅ Bank data retrieved: ${bankData.remitter.name}, Account: ${bankData.remitter.account_hash}`);

      // Step 2: Query Exchange Adapter for P2P order
      console.log(`📋 Step 2: Querying exchange for P2P order...`);
      const exchangeResponse = await axios.post(`${this.exchangeUrl}/api/exchange/lea/query`, {
        utr: utr,
        bank_account_hash: bankData.remitter.account_hash
      });

      const exchangeData = exchangeResponse.data.order;
      const walletAddress = exchangeData.withdrawal_wallet;

      traceResult.steps.exchange = {
        order_id: exchangeData.order_id,
        buyer_kyc: exchangeData.buyer_kyc,
        withdrawal_wallet: walletAddress,
        crypto_amount: exchangeData.crypto_amount,
        crypto_currency: exchangeData.crypto_currency
      };

      console.log(`✅ Exchange data retrieved: Order ${exchangeData.order_id}, Wallet: ${walletAddress}`);

      // Step 3: Get graph client
      const USE_MEMORY = process.env.USE_MEMORY_GRAPH === 'true' || !process.env.NEO4J_URI;
      const graph = USE_MEMORY ? getSharedGraph() : new Neo4jClient();

      // Step 4: Stitch identities
      console.log(`📋 Step 3: Stitching identities...`);
      try {
        await graph.stitchIdentity(bankData.remitter.account_hash, walletAddress);
        await graph.stitchExchangeIdentity(exchangeData.order_id, walletAddress);
        console.log(`✅ Identities stitched: bank → exchange → wallet`);
      } catch (error) {
        console.error(`⚠️  Error stitching identities:`, error.message);
        traceResult.errors.push(`Identity stitching: ${error.message}`);
      }

      // Step 5: Fetch blockchain data from Moralis
      console.log(`📋 Step 4: Fetching blockchain transfers from Moralis...`);
      const [erc20Transfers, nativeTransfers] = await Promise.all([
        this.moralisClient.getTransfers(walletAddress, chain, { limit: 100 }).catch(() => []),
        this.moralisClient.getNativeTransfers(walletAddress, chain, { limit: 100 }).catch(() => [])
      ]);

      const allTransfers = [...erc20Transfers, ...nativeTransfers];
      console.log(`✅ Fetched ${allTransfers.length} transfers (${erc20Transfers.length} ERC20, ${nativeTransfers.length} native)`);

      // Step 6: Ingest transfers into graph
      console.log(`📋 Step 5: Ingesting transfers into graph...`);
      let ingested = 0;
      for (const transfer of allTransfers) {
        try {
          await graph.ingestTransferEvent(transfer);
          ingested++;
        } catch (error) {
          console.error(`Error ingesting transfer:`, error.message);
        }
      }

      // Fetch transfers for destination addresses (2 levels deep)
      const destinationAddresses = new Set();
      allTransfers.forEach(tx => {
        if (tx.to && tx.to.startsWith('0x')) {
          destinationAddresses.add(tx.to.toLowerCase());
        }
        if (tx.from && tx.from.startsWith('0x')) {
          destinationAddresses.add(tx.from.toLowerCase());
        }
      });

      console.log(`📋 Step 6: Fetching transfers for ${destinationAddresses.size} related addresses...`);
      const destArray = Array.from(destinationAddresses).slice(0, 10);
      for (const destAddr of destArray) {
        try {
          const [destErc20, destNative] = await Promise.all([
            this.moralisClient.getTransfers(destAddr, chain, { limit: 30 }).catch(() => []),
            this.moralisClient.getNativeTransfers(destAddr, chain, { limit: 30 }).catch(() => [])
          ]);
          
          const destTransfers = [...destErc20, ...destNative];
          for (const tx of destTransfers) {
            await graph.ingestTransferEvent(tx);
            ingested++;
          }
          
          if (destTransfers.length > 0) {
            console.log(`  ✅ Fetched ${destTransfers.length} transfers for ${destAddr.slice(0, 10)}...`);
          }
        } catch (error) {
          console.warn(`  ⚠️  Could not fetch transfers for ${destAddr}:`, error.message);
        }
      }

      console.log(`✅ Ingested ${ingested} total transfers into graph`);

      traceResult.steps.wallet = {
        address: walletAddress,
        transfers_fetched: allTransfers.length,
        transfers_ingested: ingested
      };

      // Step 7: Run tracer
      console.log(`📋 Step 7: Running path tracer...`);
      const tracer = new Tracer();
      const seed = `chain:${walletAddress}`;
      const traceParams = {
        seed: seed,
        depth: depth,
        hours: hours,
        minAmt: minAmt
      };

      const tracerResult = await tracer.trace(traceParams);
      await tracer.close();

      traceResult.steps.blockchain = {
        paths_found: tracerResult.total_paths,
        nodes: tracerResult.total_nodes,
        edges: tracerResult.total_edges,
        exchange_endpoints: tracerResult.exchange_endpoints
      };

      traceResult.graph = {
        nodes: tracerResult.nodes,
        edges: tracerResult.edges,
        paths: tracerResult.paths
      };

      console.log(`✅ Tracer complete: ${tracerResult.total_paths} paths, ${tracerResult.total_nodes} nodes`);

      traceResult.success = true;
      return traceResult;

    } catch (error) {
      console.error('Error in automated tracing:', error);
      traceResult.success = false;
      traceResult.errors.push(error.message);
      return traceResult;
    }
  }

  /**
   * Get asset references from trace result
   * @param {object} traceResult - Trace result from traceFromUTR
   * @returns {Array<string>} Asset references
   */
  extractAssetReferences(traceResult) {
    const assetRefs = [];

    // Add bank account
    if (traceResult.steps.bank?.account_hash) {
      assetRefs.push(`bank:${traceResult.steps.bank.account_hash}`);
    }

    // Add exchange order
    if (traceResult.steps.exchange?.order_id) {
      assetRefs.push(`exchange:${traceResult.steps.exchange.order_id}`);
    }

    // Add wallet addresses from graph
    if (traceResult.graph.nodes) {
      traceResult.graph.nodes.forEach(node => {
        if (node.id.startsWith('chain:')) {
          assetRefs.push(node.id);
        }
      });
    }

    return assetRefs;
  }
}

module.exports = AutomatedTracingService;

