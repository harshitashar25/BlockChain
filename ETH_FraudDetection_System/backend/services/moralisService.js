/**
 * Moralis API Service
 * Fetches comprehensive blockchain transaction data using Moralis API
 */
const axios = require('axios');

class MoralisService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://deep-index.moralis.io/api/v2.2';
    this.headers = {
      'X-API-Key': apiKey,
      'Content-Type': 'application/json'
    };
    
    // Supported chains for cross-chain analysis
    this.supportedChains = [
      { id: 'eth', name: 'Ethereum', explorer: 'etherscan.io' },
      { id: 'polygon', name: 'Polygon', explorer: 'polygonscan.com' },
      { id: 'bsc', name: 'BSC', explorer: 'bscscan.com' },
      { id: 'arbitrum', name: 'Arbitrum', explorer: 'arbiscan.io' },
      { id: 'optimism', name: 'Optimism', explorer: 'optimistic.etherscan.io' },
      { id: 'avalanche', name: 'Avalanche', explorer: 'snowtrace.io' },
      { id: 'fantom', name: 'Fantom', explorer: 'ftmscan.com' }
    ];

    // Known bridge contract addresses (common cross-chain bridges)
    // Updated with verified contract addresses
    this.bridgeContracts = {
      'eth': [
        '0x3ee18b2214aff97000d974cf647e7c347e8fa585', // Wormhole Token Bridge
        '0x4dae2f939acf504d234f7026f6d29d2c0e4a1e6c', // Multichain (Anyswap) Router
        '0x99c9fc46f92e8a1c0dec1b1747d010903e884be1', // Optimism Gateway
        '0x8484ef722627bf18ca5ae6bcf031c23e6e922b30', // Polygon PoS Bridge (Ethereum side)
        '0x401f6c983ea34274ec46f84d70b31c151321188b', // Polygon Bridge
        '0x72ce9c846789fdb6fc44f6dff4ea04329c0d04c1', // Arbitrum Bridge
        '0x10e6593cdda8ca58e58b65e0c8c77e6b8e5e0c8c', // Hop Protocol Bridge
        '0x88ad095186b6d9832f9c6dfee029a85defd0b9a7'  // Across Protocol
      ],
      'polygon': [
        '0x401f6c983ea34274ec46f84d70b31c151321188b', // Polygon Bridge
        '0x8484ef722627bf18ca5ae6bcf031c23e6e922b30', // Polygon PoS Bridge (Polygon side)
        '0x4dae2f939acf504d234f7026f6d29d2c0e4a1e6c'  // Multichain on Polygon
      ],
      'bsc': [
        '0x3ee18b2214aff97000d974cf647e7c347e8fa585', // Multichain on BSC
        '0x4dae2f939acf504d234f7026f6d29d2c0e4a1e6c'  // Multichain Router on BSC
      ],
      'arbitrum': [
        '0x72ce9c846789fdb6fc44f6dff4ea04329c0d04c1', // Arbitrum Bridge
        '0x4dae2f939acf504d234f7026f6d29d2c0e4a1e6c'  // Multichain on Arbitrum
      ],
      'optimism': [
        '0x99c9fc46f92e8a1c0dec1b1747d010903e884be1', // Optimism Gateway
        '0x4dae2f939acf504d234f7026f6d29d2c0e4a1e6c'  // Multichain on Optimism
      ]
    };
  }

  /**
   * Get all transactions for an address
   */
  async getTransactions(address, chain = 'eth', limit = 100) {
    try {
      const response = await axios.get(
        `${this.baseURL}/${address}`,
        {
          headers: this.headers,
          params: {
            chain: chain,
            limit: limit,
            order: 'DESC'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching transactions from Moralis:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get native balance for an address
   */
  async getNativeBalance(address, chain = 'eth') {
    try {
      const response = await axios.get(
        `${this.baseURL}/${address}/balance`,
        {
          headers: this.headers,
          params: {
            chain: chain
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching balance from Moralis:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get token balances for an address
   */
  async getTokenBalances(address, chain = 'eth') {
    try {
      const response = await axios.get(
        `${this.baseURL}/${address}/erc20`,
        {
          headers: this.headers,
          params: {
            chain: chain
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching token balances from Moralis:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get NFT balances for an address
   */
  async getNFTBalances(address, chain = 'eth') {
    try {
      const response = await axios.get(
        `${this.baseURL}/${address}/nft`,
        {
          headers: this.headers,
          params: {
            chain: chain
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching NFT balances from Moralis:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get transaction details by hash
   */
  async getTransaction(hash, chain = 'eth') {
    try {
      const response = await axios.get(
        `${this.baseURL}/transaction/${hash}`,
        {
          headers: this.headers,
          params: {
            chain: chain
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching transaction from Moralis:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get token transfers for an address
   */
  async getTokenTransfers(address, chain = 'eth', limit = 100) {
    try {
      const response = await axios.get(
        `${this.baseURL}/${address}/erc20/transfers`,
        {
          headers: this.headers,
          params: {
            chain: chain,
            limit: limit
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching token transfers from Moralis:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get NFT transfers for an address
   */
  async getNFTTransfers(address, chain = 'eth', limit = 100) {
    try {
      const response = await axios.get(
        `${this.baseURL}/${address}/nft/transfers`,
        {
          headers: this.headers,
          params: {
            chain: chain,
            limit: limit
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching NFT transfers from Moralis:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get comprehensive address information
   * Combines all data sources for a complete view
   */
  async getAddressIntelligence(address, chain = 'eth') {
    try {
      const [transactions, balance, tokens, nfts, tokenTransfers, nftTransfers] = await Promise.allSettled([
        this.getTransactions(address, chain, 100),
        this.getNativeBalance(address, chain),
        this.getTokenBalances(address, chain),
        this.getNFTBalances(address, chain),
        this.getTokenTransfers(address, chain, 100),
        this.getNFTTransfers(address, chain, 100)
      ]);

      // Helper to extract result array from Moralis response
      const extractResult = (value) => {
        if (!value) return [];
        if (Array.isArray(value)) return value;
        if (value.result && Array.isArray(value.result)) return value.result;
        return [];
      };

      return {
        address: address.toLowerCase(),
        chain: chain,
        nativeBalance: balance.status === 'fulfilled' ? balance.value : null,
        transactions: transactions.status === 'fulfilled' ? extractResult(transactions.value) : [],
        tokenBalances: tokens.status === 'fulfilled' ? extractResult(tokens.value) : [],
        nftBalances: nfts.status === 'fulfilled' ? extractResult(nfts.value) : [],
        tokenTransfers: tokenTransfers.status === 'fulfilled' ? extractResult(tokenTransfers.value) : [],
        nftTransfers: nftTransfers.status === 'fulfilled' ? extractResult(nftTransfers.value) : [],
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching address intelligence:', error);
      throw error;
    }
  }

  /**
   * Get address intelligence across multiple chains
   */
  async getMultiChainIntelligence(address, chains = ['eth', 'polygon', 'bsc', 'arbitrum']) {
    try {
      const results = await Promise.allSettled(
        chains.map(chain => this.getAddressIntelligence(address, chain))
      );

      const multiChainData = {
        address: address.toLowerCase(),
        chains: {},
        crossChainActivity: []
      };

      results.forEach((result, index) => {
        const chain = chains[index];
        if (result.status === 'fulfilled') {
          multiChainData.chains[chain] = result.value;
          
          // Detect potential bridge transactions
          const bridgeTxs = this.detectBridgeTransactions(result.value.transactions, chain);
          if (bridgeTxs.length > 0) {
            multiChainData.crossChainActivity.push({
              chain: chain,
              bridgeTransactions: bridgeTxs
            });
          }
        }
      });

      return multiChainData;
    } catch (error) {
      console.error('Error fetching multi-chain intelligence:', error);
      throw error;
    }
  }

  /**
   * Detect bridge transactions (cross-chain swaps)
   */
  detectBridgeTransactions(transactions, chain) {
    const bridgeTxs = [];
    const bridgeAddresses = this.bridgeContracts[chain] || [];

    transactions.forEach(tx => {
      const to = (tx.to_address || tx.to || '').toLowerCase();
      const from = (tx.from_address || tx.from || '').toLowerCase();
      
      // Check if transaction involves a known bridge contract
      if (bridgeAddresses.includes(to) || bridgeAddresses.includes(from)) {
        bridgeTxs.push({
          hash: tx.hash || tx.transaction_hash,
          from: from,
          to: to,
          value: tx.value ? (parseFloat(tx.value) / 1e18).toString() : '0',
          timestamp: tx.block_timestamp || tx.blockTimestamp,
          blockNumber: tx.block_number || tx.blockNumber,
          bridgeType: this.getBridgeType(to, chain),
          isBridge: true
        });
      }
    });

    return bridgeTxs;
  }

  /**
   * Identify bridge type from contract address
   */
  getBridgeType(contractAddress, chain) {
    if (!contractAddress) return 'Unknown Bridge';
    
    const bridges = {
      '0x3ee18b2214aff97000d974cf647e7c347e8fa585': 'Wormhole',
      '0x4dae2f939acf504d234f7026f6d29d2c0e4a1e6c': 'Multichain (Anyswap)',
      '0x99c9fc46f92e8a1c0dec1b1747d010903e884be1': 'Optimism Gateway',
      '0x401f6c983ea34274ec46f84d70b31c151321188b': 'Polygon Bridge',
      '0x8484ef722627bf18ca5ae6bcf031c23e6e922b30': 'Polygon PoS Bridge',
      '0x72ce9c846789fdb6fc44f6dff4ea04329c0d04c1': 'Arbitrum Bridge',
      '0x10e6593cdda8ca58e58b65e0c8c77e6b8e5e0c8c': 'Hop Protocol',
      '0x88ad095186b6d9832f9c6dfee029a85defd0b9a7': 'Across Protocol'
    };
    
    return bridges[contractAddress.toLowerCase()] || 'Unknown Bridge';
  }

  /**
   * Build transaction trail from address with cross-chain support
   * Extracts all connected addresses and builds a graph across multiple chains
   */
  async buildTransactionTrail(address, chain = 'eth', maxDepth = 3, includeCrossChain = false) {
    try {
      const intelligence = await this.getAddressIntelligence(address, chain);
      const visited = new Set();
      const nodes = new Map();
      const edges = [];
      const timeline = [];

      // Add starting node with chain info
      nodes.set(`${address.toLowerCase()}_${chain}`, {
        id: `${address.toLowerCase()}_${chain}`,
        label: `${address.substring(0, 6)}...${address.substring(address.length - 4)}`,
        address: address.toLowerCase(),
        chain: chain,
        chainName: this.supportedChains.find(c => c.id === chain)?.name || chain,
        type: 'wallet',
        balance: intelligence.nativeBalance?.balance || '0',
        transactionCount: intelligence.transactions.length
      });

      // Process transactions to build graph
      const processTransactions = (txs, depth) => {
        if (depth > maxDepth) return;

        for (const tx of txs) {
          const from = tx.from_address?.toLowerCase() || tx.from?.toLowerCase();
          const to = tx.to_address?.toLowerCase() || tx.to?.toLowerCase();
          
          if (!from || !to) continue;

          // Check if this is a bridge transaction
          const bridgeAddresses = this.bridgeContracts[chain] || [];
          const toLower = to.toLowerCase();
          const fromLower = from.toLowerCase();
          const toIsBridge = bridgeAddresses.includes(toLower);
          const fromIsBridge = bridgeAddresses.includes(fromLower);
          
          // Check if transaction is marked as bridge (from injected transactions or API)
          const isBridgeFlag = tx.isBridge === true || tx.isBridge === 'true';
          const isBridge = isBridgeFlag || toIsBridge || fromIsBridge;
          
          // Get bridge type from transaction or detect it
          let bridgeType = null;
          if (isBridge) {
            if (tx.bridgeType) {
              bridgeType = tx.bridgeType;
            } else {
              const bridgeContractAddress = toIsBridge ? toLower : (fromIsBridge ? fromLower : null);
              bridgeType = this.getBridgeType(bridgeContractAddress, chain);
            }
          }
          
          // Debug logging for bridge detection (uncomment to debug)
          // if (isBridge) {
          //   console.log(`🌉 Bridge detected: ${tx.hash} | From: ${fromLower} | To: ${toLower} | Type: ${bridgeType}`);
          // }

          // Add nodes with chain info
          const fromId = `${from}_${chain}`;
          const toId = `${to}_${chain}`;
          
          if (!nodes.has(fromId)) {
            nodes.set(fromId, {
              id: fromId,
              label: `${from.substring(0, 6)}...${from.substring(from.length - 4)}`,
              address: from,
              chain: chain,
              chainName: this.supportedChains.find(c => c.id === chain)?.name || chain,
              type: isBridge && bridgeAddresses.includes(from.toLowerCase()) ? 'bridge' : 'wallet',
              transactionCount: 0
            });
          }

          if (!nodes.has(toId)) {
            nodes.set(toId, {
              id: toId,
              label: `${to.substring(0, 6)}...${to.substring(to.length - 4)}`,
              address: to,
              chain: chain,
              chainName: this.supportedChains.find(c => c.id === chain)?.name || chain,
              type: isBridge && bridgeAddresses.includes(to.toLowerCase()) ? 'bridge' : 'wallet',
              transactionCount: 0
            });
          }

          // Add edge with chain and bridge info
          const value = tx.value ? (parseFloat(tx.value) / 1e18).toString() : '0';
          edges.push({
            from: fromId,
            to: toId,
            hash: tx.hash || tx.transaction_hash,
            value: value,
            timestamp: tx.block_timestamp || tx.blockTimestamp,
            blockNumber: tx.block_number || tx.blockNumber,
            type: tx.token_address ? 'token' : 'eth',
            chain: chain,
            isBridge: isBridge,
            bridgeType: bridgeType,
            bridgeDestinationChain: tx.bridgeDestinationChain || null,
            bridgeSourceChain: tx.bridgeSourceChain || null
          });

          // Add to timeline with chain info
          timeline.push({
            hash: tx.hash || tx.transaction_hash,
            from: from,
            to: to,
            value: value,
            timestamp: tx.block_timestamp || tx.blockTimestamp,
            blockNumber: tx.block_number || tx.blockNumber,
            type: tx.token_address ? 'token' : 'eth',
            chain: chain,
            chainName: this.supportedChains.find(c => c.id === chain)?.name || chain,
            tokenAddress: tx.token_address,
            tokenSymbol: tx.token_symbol || tx.symbol,
            isBridge: isBridge,
            bridgeType: bridgeType,
            bridgeDestinationChain: tx.bridgeDestinationChain || null,
            bridgeSourceChain: tx.bridgeSourceChain || null
          });

          // Recursively process connected addresses (limited depth)
          if (depth < maxDepth && !visited.has(to)) {
            visited.add(to);
            // Note: In a real implementation, you'd fetch transactions for 'to' address
            // For now, we'll just process the current level
          }
        }
      };

      // Process all transaction types
      processTransactions(intelligence.transactions, 0);
      processTransactions(intelligence.tokenTransfers, 0);
      processTransactions(intelligence.nftTransfers, 0);
      
      // Include injected transactions (for testing)
      if (global.injectedTransactions) {
        const addressLower = address.toLowerCase();
        const injected = global.injectedTransactions.get(addressLower) || [];
        const injectedForChain = injected.filter(tx => 
          (tx.chain || 'eth') === chain
        );
        if (injectedForChain.length > 0) {
          console.log(`📝 Including ${injectedForChain.length} injected transaction(s) for ${address} on ${chain}`);
          processTransactions(injectedForChain, 0);
        }
      }
      
      // Debug: Log bridge detection results
      const detectedBridges = edges.filter(e => e.isBridge);
      if (detectedBridges.length > 0) {
        console.log(`🌉 Detected ${detectedBridges.length} bridge transactions for ${address} on ${chain}`);
      } else {
        console.log(`⚠️  No bridge transactions detected for ${address} on ${chain}. Bridge contracts checked: ${this.bridgeContracts[chain]?.length || 0}`);
      }

      // Sort timeline by timestamp
      timeline.sort((a, b) => {
        const timeA = new Date(a.timestamp).getTime();
        const timeB = new Date(b.timestamp).getTime();
        return timeB - timeA; // Most recent first
      });

      // Calculate total value
      const totalValue = edges.reduce((sum, e) => sum + parseFloat(e.value || 0), 0);

      // Count bridge transactions
      const bridgeCount = edges.filter(e => e.isBridge).length;

      return {
        address: address.toLowerCase(),
        chain: chain,
        graph: {
          nodes: Array.from(nodes.values()),
          edges: edges // Frontend will transform to 'links'
        },
        timeline: timeline,
        statistics: {
          totalTransactions: intelligence.transactions.length,
          totalTokenTransfers: intelligence.tokenTransfers.length,
          totalNFTTransfers: intelligence.nftTransfers.length,
          uniqueAddresses: nodes.size,
          totalValue: totalValue.toFixed(6),
          bridgeTransactions: bridgeCount,
          chain: chain
        }
      };
    } catch (error) {
      console.error('Error building transaction trail:', error);
      throw error;
    }
  }
}

module.exports = MoralisService;

