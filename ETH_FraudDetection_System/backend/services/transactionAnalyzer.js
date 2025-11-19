const { ethers } = require('ethers');

/**
 * Transaction Analyzer
 * Analyzes transactions to detect:
 * - Token transfers (ERC20)
 * - NFT transfers (ERC721/ERC1155)
 * - Contract interactions
 * - Event logs
 */
class TransactionAnalyzer {
  constructor(provider) {
    this.provider = provider;
    
    // Common event signatures
    this.eventSignatures = {
      // ERC20 Transfer
      'Transfer': '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
      // ERC20 Approval
      'Approval': '0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925',
      // ERC721 Transfer
      'TransferNFT': '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
      // ERC1155 TransferSingle
      'TransferSingle': '0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62',
      // ERC1155 TransferBatch
      'TransferBatch': '0x4a39dc06d4c0dbc64b70af90fd698a233a518aa5d07e595d983b8c0526c8f7fb'
    };
  }

  /**
   * Analyze transaction and receipt to extract all activity
   */
  async analyzeTransaction(txData, receipt) {
    const activities = [];

    // 1. Check for native ETH transfer
    if (txData.value && txData.value !== '0') {
      activities.push({
        type: 'ETH_TRANSFER',
        from: txData.from,
        to: txData.to,
        value: txData.value,
        valueEth: txData.valueEth
      });
    }

    // 2. Analyze event logs for token/NFT transfers
    if (receipt && receipt.logs) {
      for (const log of receipt.logs) {
        const logAnalysis = await this.analyzeLog(log, txData);
        if (logAnalysis) {
          activities.push(logAnalysis);
        }
      }
    }

    // 3. Check for contract interaction
    if (txData.to && txData.inputData && txData.inputData !== '0x') {
      const contractAnalysis = await this.analyzeContractInteraction(txData);
      if (contractAnalysis) {
        activities.push(contractAnalysis);
      }
    }

    return activities;
  }

  /**
   * Analyze a single event log
   */
  async analyzeLog(log, txData) {
    const topics = log.topics || [];
    if (topics.length === 0) return null;

    const eventSignature = topics[0];

    // ERC20 Transfer
    if (eventSignature === this.eventSignatures.Transfer && topics.length === 3) {
      try {
        const from = '0x' + topics[1].slice(26);
        const to = '0x' + topics[2].slice(26);
        
        // Decode the data (value for ERC20)
        const data = log.data;
        let value = '0';
        if (data && data !== '0x') {
          value = BigInt(data).toString();
        }

        // Check if this is ERC721 (has tokenId in topics) or ERC20
        // ERC721 has 4 topics, ERC20 has 3 topics with value in data
        if (topics.length === 4) {
          // ERC721 NFT Transfer
          const tokenId = BigInt(topics[3]).toString();
          return {
            type: 'NFT_TRANSFER',
            standard: 'ERC721',
            contract: log.address,
            from,
            to,
            tokenId,
            transactionHash: txData.hash
          };
        } else {
          // ERC20 Token Transfer
          return {
            type: 'TOKEN_TRANSFER',
            standard: 'ERC20',
            contract: log.address,
            from,
            to,
            value,
            transactionHash: txData.hash
          };
        }
      } catch (error) {
        console.error('Error parsing Transfer event:', error);
      }
    }

    // ERC1155 TransferSingle
    if (eventSignature === this.eventSignatures.TransferSingle) {
      try {
        const operator = '0x' + topics[1].slice(26);
        const from = '0x' + topics[2].slice(26);
        const to = '0x' + topics[3].slice(26);
        
        // Decode data: tokenId (uint256), value (uint256)
        const data = log.data.slice(2); // Remove 0x
        const tokenId = BigInt('0x' + data.slice(0, 64)).toString();
        const value = BigInt('0x' + data.slice(64, 128)).toString();

        return {
          type: 'NFT_TRANSFER',
          standard: 'ERC1155',
          contract: log.address,
          operator,
          from,
          to,
          tokenId,
          value,
          transactionHash: txData.hash
        };
      } catch (error) {
        console.error('Error parsing TransferSingle event:', error);
      }
    }

    // ERC1155 TransferBatch
    if (eventSignature === this.eventSignatures.TransferBatch) {
      try {
        const operator = '0x' + topics[1].slice(26);
        const from = '0x' + topics[2].slice(26);
        const to = '0x' + topics[3].slice(26);
        
        // Decode data: tokenIds (uint256[]), values (uint256[])
        // This is more complex, simplified for now
        return {
          type: 'NFT_TRANSFER',
          standard: 'ERC1155',
          contract: log.address,
          operator,
          from,
          to,
          batch: true,
          transactionHash: txData.hash
        };
      } catch (error) {
        console.error('Error parsing TransferBatch event:', error);
      }
    }

    // Generic event (not recognized)
    return {
      type: 'EVENT',
      contract: log.address,
      eventSignature,
      topics: topics.slice(1), // Remove signature topic
      data: log.data,
      transactionHash: txData.hash
    };
  }

  /**
   * Analyze contract interaction
   */
  async analyzeContractInteraction(txData) {
    try {
      const inputData = txData.inputData;
      if (!inputData || inputData === '0x' || inputData.length < 10) {
        return null;
      }

      // Extract function selector (first 4 bytes = 10 hex chars including 0x)
      const functionSelector = inputData.slice(0, 10);
      
      // Common function selectors
      const commonFunctions = {
        '0xa9059cbb': 'transfer(address,uint256)',
        '0x23b872dd': 'transferFrom(address,address,uint256)',
        '0x095ea7b3': 'approve(address,uint256)',
        '0x40c10f19': 'mint(address,uint256)',
        '0x42966c68': 'burn(uint256)',
        '0x02751cec': 'deposit()',
        '0x2e1a7d4d': 'withdraw(uint256)'
      };

      const functionName = commonFunctions[functionSelector] || `unknown_${functionSelector}`;

      return {
        type: 'CONTRACT_INTERACTION',
        contract: txData.to,
        functionSelector,
        functionName,
        inputData,
        transactionHash: txData.hash
      };
    } catch (error) {
      console.error('Error analyzing contract interaction:', error);
      return null;
    }
  }

  /**
   * Get token metadata (symbol, decimals, name)
   */
  async getTokenMetadata(tokenAddress) {
    try {
      // ERC20 standard ABI for metadata
      const erc20Abi = [
        'function symbol() view returns (string)',
        'function decimals() view returns (uint8)',
        'function name() view returns (string)'
      ];

      const tokenContract = new ethers.Contract(tokenAddress, erc20Abi, this.provider);
      
      const [symbol, decimals, name] = await Promise.all([
        tokenContract.symbol().catch(() => 'UNKNOWN'),
        tokenContract.decimals().catch(() => 18),
        tokenContract.name().catch(() => 'Unknown Token')
      ]);

      return { symbol, decimals, name };
    } catch (error) {
      console.error(`Error getting token metadata for ${tokenAddress}:`, error);
      return { symbol: 'UNKNOWN', decimals: 18, name: 'Unknown Token' };
    }
  }
}

module.exports = TransactionAnalyzer;

