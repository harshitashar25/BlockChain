/**
 * Transaction Trail Service
 * Builds transaction trails and graphs showing fund flows between addresses
 * Similar to Arkham Intel's transaction trail feature
 */
class TransactionTrail {
  constructor() {
    // Store transaction graph: address -> { incoming: [], outgoing: [] }
    this.transactionGraph = new Map();
    
    // Store all transactions with relationships
    this.transactions = [];
    
    // Address clusters (addresses controlled by same entity)
    this.addressClusters = new Map();
  }

  /**
   * Add a transaction to the trail
   */
  addTransaction(txData) {
    const { from, to, value, hash, blockNumber, timestamp, activities } = txData;
    
    if (!from || !to) return;

    const fromLower = from.toLowerCase();
    const toLower = to.toLowerCase();

    // Store transaction
    const transaction = {
      hash,
      from: fromLower,
      to: toLower,
      value: value || '0',
      valueEth: txData.valueEth || '0',
      blockNumber,
      timestamp,
      activities: activities || [],
      type: this.getTransactionType(activities)
    };

    this.transactions.push(transaction);

    // Build graph structure
    if (!this.transactionGraph.has(fromLower)) {
      this.transactionGraph.set(fromLower, { incoming: [], outgoing: [] });
    }
    if (!this.transactionGraph.has(toLower)) {
      this.transactionGraph.set(toLower, { incoming: [], outgoing: [] });
    }

    // Add outgoing connection
    this.transactionGraph.get(fromLower).outgoing.push({
      to: toLower,
      hash,
      value,
      valueEth: txData.valueEth || '0',
      timestamp,
      blockNumber
    });

    // Add incoming connection
    this.transactionGraph.get(toLower).incoming.push({
      from: fromLower,
      hash,
      value,
      valueEth: txData.valueEth || '0',
      timestamp,
      blockNumber
    });
  }

  /**
   * Get transaction type from activities
   */
  getTransactionType(activities) {
    if (!activities || activities.length === 0) return 'ETH';
    
    const activity = activities[0];
    if (activity.type === 'TOKEN_TRANSFER') return 'TOKEN';
    if (activity.type === 'NFT_TRANSFER') return 'NFT';
    if (activity.type === 'CONTRACT_INTERACTION') return 'CONTRACT';
    return 'ETH';
  }

  /**
   * Build transaction trail from a starting address
   * Returns path of transactions showing fund flow
   */
  buildTrail(startAddress, maxHops = 5, direction = 'both') {
    const startLower = startAddress.toLowerCase();
    const visited = new Set();
    const trail = {
      startAddress: startLower,
      paths: [],
      totalValue: '0',
      transactionCount: 0
    };

    // BFS to find all connected transactions
    const queue = [{ address: startLower, path: [], depth: 0 }];
    
    while (queue.length > 0) {
      const { address, path, depth } = queue.shift();
      
      if (depth >= maxHops || visited.has(address)) continue;
      visited.add(address);

      const node = this.transactionGraph.get(address);
      if (!node) continue;

      // Explore outgoing transactions
      if (direction === 'outgoing' || direction === 'both') {
        for (const tx of node.outgoing) {
          if (!visited.has(tx.to)) {
            const newPath = [...path, {
              from: address,
              to: tx.to,
              hash: tx.hash,
              value: tx.valueEth,
              timestamp: tx.timestamp,
              blockNumber: tx.blockNumber,
              direction: 'outgoing'
            }];
            
            trail.paths.push(newPath);
            trail.transactionCount++;
            
            queue.push({
              address: tx.to,
              path: newPath,
              depth: depth + 1
            });
          }
        }
      }

      // Explore incoming transactions
      if (direction === 'incoming' || direction === 'both') {
        for (const tx of node.incoming) {
          if (!visited.has(tx.from)) {
            const newPath = [...path, {
              from: tx.from,
              to: address,
              hash: tx.hash,
              value: tx.valueEth,
              timestamp: tx.timestamp,
              blockNumber: tx.blockNumber,
              direction: 'incoming'
            }];
            
            trail.paths.push(newPath);
            trail.transactionCount++;
            
            queue.push({
              address: tx.from,
              path: newPath,
              depth: depth + 1
            });
          }
        }
      }
    }

    // Calculate total value
    let totalValue = BigInt(0);
    trail.paths.forEach(path => {
      path.forEach(step => {
        const value = BigInt(step.value.replace('.', '') || '0');
        totalValue += value;
      });
    });
    trail.totalValue = totalValue.toString();

    return trail;
  }

  /**
   * Find all addresses connected to a given address
   */
  getConnectedAddresses(address, maxDepth = 3) {
    const addressLower = address.toLowerCase();
    const connected = new Set();
    const visited = new Set();
    const queue = [{ address: addressLower, depth: 0 }];

    while (queue.length > 0) {
      const { address: current, depth } = queue.shift();
      
      if (depth >= maxDepth || visited.has(current)) continue;
      visited.add(current);
      connected.add(current);

      const node = this.transactionGraph.get(current);
      if (!node) continue;

      // Add outgoing connections
      node.outgoing.forEach(tx => {
        if (!visited.has(tx.to)) {
          connected.add(tx.to);
          queue.push({ address: tx.to, depth: depth + 1 });
        }
      });

      // Add incoming connections
      node.incoming.forEach(tx => {
        if (!visited.has(tx.from)) {
          connected.add(tx.from);
          queue.push({ address: tx.from, depth: depth + 1 });
        }
      });
    }

    connected.delete(addressLower); // Remove the starting address
    return Array.from(connected);
  }

  /**
   * Get transaction flow between two addresses
   */
  getFlowBetween(fromAddress, toAddress) {
    const fromLower = fromAddress.toLowerCase();
    const toLower = toAddress.toLowerCase();

    const flows = [];
    const node = this.transactionGraph.get(fromLower);
    
    if (node) {
      node.outgoing.forEach(tx => {
        if (tx.to === toLower) {
          flows.push({
            hash: tx.hash,
            value: tx.valueEth,
            timestamp: tx.timestamp,
            blockNumber: tx.blockNumber
          });
        }
      });
    }

    return flows;
  }

  /**
   * Get address statistics
   */
  getAddressStats(address) {
    const addressLower = address.toLowerCase();
    const node = this.transactionGraph.get(addressLower);
    
    if (!node) {
      return {
        address: addressLower,
        incomingCount: 0,
        outgoingCount: 0,
        totalIncoming: '0',
        totalOutgoing: '0',
        uniqueConnections: 0
      };
    }

    let totalIncoming = BigInt(0);
    let totalOutgoing = BigInt(0);
    const connections = new Set();

    node.incoming.forEach(tx => {
      const value = BigInt(Math.floor(parseFloat(tx.valueEth || '0') * 1e18));
      totalIncoming += value;
      connections.add(tx.from);
    });

    node.outgoing.forEach(tx => {
      const value = BigInt(Math.floor(parseFloat(tx.valueEth || '0') * 1e18));
      totalOutgoing += value;
      connections.add(tx.to);
    });

    const { ethers } = require('ethers');

    return {
      address: addressLower,
      incomingCount: node.incoming.length,
      outgoingCount: node.outgoing.length,
      totalIncoming: ethers.formatEther(totalIncoming.toString()),
      totalOutgoing: ethers.formatEther(totalOutgoing.toString()),
      uniqueConnections: connections.size,
      firstSeen: node.incoming.length > 0 
        ? node.incoming[0].timestamp 
        : (node.outgoing.length > 0 ? node.outgoing[0].timestamp : null),
      lastSeen: node.outgoing.length > 0 
        ? node.outgoing[node.outgoing.length - 1].timestamp 
        : (node.incoming.length > 0 ? node.incoming[node.incoming.length - 1].timestamp : null)
    };
  }

  /**
   * Get all transactions for an address
   */
  getAddressTransactions(address, limit = 100) {
    const addressLower = address.toLowerCase();
    return this.transactions
      .filter(tx => tx.from === addressLower || tx.to === addressLower)
      .slice(0, limit);
  }

  /**
   * Find shortest path between two addresses
   */
  findPath(fromAddress, toAddress, maxHops = 10) {
    const fromLower = fromAddress.toLowerCase();
    const toLower = toAddress.toLowerCase();

    if (fromLower === toLower) {
      return { path: [], found: true };
    }

    const visited = new Set();
    const queue = [{ address: fromLower, path: [] }];

    while (queue.length > 0) {
      const { address, path } = queue.shift();
      
      if (visited.has(address) || path.length >= maxHops) continue;
      visited.add(address);

      const node = this.transactionGraph.get(address);
      if (!node) continue;

      // Check outgoing transactions
      for (const tx of node.outgoing) {
        if (tx.to === toLower) {
          return {
            found: true,
            path: [...path, {
              from: address,
              to: tx.to,
              hash: tx.hash,
              value: tx.valueEth,
              timestamp: tx.timestamp,
              blockNumber: tx.blockNumber
            }]
          };
        }

        if (!visited.has(tx.to)) {
          queue.push({
            address: tx.to,
            path: [...path, {
              from: address,
              to: tx.to,
              hash: tx.hash,
              value: tx.valueEth,
              timestamp: tx.timestamp,
              blockNumber: tx.blockNumber
            }]
          });
        }
      }
    }

    return { found: false, path: [] };
  }

  /**
   * Get transaction graph data for visualization
   */
  getGraphData(addresses = null, maxDepth = 2) {
    const nodes = new Map();
    const edges = [];

    const addressesToExplore = addresses || Array.from(this.transactionGraph.keys());
    const visited = new Set();

    const explore = (address, depth) => {
      if (depth > maxDepth || visited.has(address)) return;
      visited.add(address);

      const node = this.transactionGraph.get(address);
      if (!node) return;

      // Add node
      if (!nodes.has(address)) {
        const stats = this.getAddressStats(address);
        nodes.set(address, {
          id: address,
          label: `${address.substring(0, 6)}...${address.substring(address.length - 4)}`,
          address: address,
          ...stats
        });
      }

      // Explore connections
      node.outgoing.forEach(tx => {
        if (!nodes.has(tx.to)) {
          const stats = this.getAddressStats(tx.to);
          nodes.set(tx.to, {
            id: tx.to,
            label: `${tx.to.substring(0, 6)}...${tx.to.substring(tx.to.length - 4)}`,
            address: tx.to,
            ...stats
          });
        }

        edges.push({
          from: address,
          to: tx.to,
          hash: tx.hash,
          value: tx.valueEth,
          timestamp: tx.timestamp,
          blockNumber: tx.blockNumber
        });

        explore(tx.to, depth + 1);
      });
    };

    addressesToExplore.forEach(addr => explore(addr.toLowerCase(), 0));

    return {
      nodes: Array.from(nodes.values()),
      edges: edges
    };
  }
}

module.exports = TransactionTrail;

