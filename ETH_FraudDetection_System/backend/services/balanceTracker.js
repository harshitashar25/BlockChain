const { ethers } = require('ethers');

/**
 * Balance Tracker
 * Tracks balance changes for tracked addresses
 */
class BalanceTracker {
  constructor(provider) {
    this.provider = provider;
    this.balances = new Map(); // address -> { eth: '0', tokens: {} }
  }

  /**
   * Get current ETH balance for an address
   */
  async getEthBalance(address) {
    try {
      const balance = await this.provider.getBalance(address);
      return balance.toString();
    } catch (error) {
      console.error(`Error getting ETH balance for ${address}:`, error);
      return '0';
    }
  }

  /**
   * Get token balance for an address
   */
  async getTokenBalance(tokenAddress, walletAddress) {
    try {
      const erc20Abi = ['function balanceOf(address) view returns (uint256)'];
      const tokenContract = new ethers.Contract(tokenAddress, erc20Abi, this.provider);
      const balance = await tokenContract.balanceOf(walletAddress);
      return balance.toString();
    } catch (error) {
      console.error(`Error getting token balance:`, error);
      return '0';
    }
  }

  /**
   * Track balance change for a transaction
   */
  async trackBalanceChange(address, txData, receipt) {
    const normalized = address.toLowerCase();
    
    // Get previous balance (if tracked)
    const previous = this.balances.get(normalized) || { eth: null, tokens: {} };
    
    // Get current balance
    const currentEth = await this.getEthBalance(address);
    
    // Calculate balance change
    let balanceDelta = '0';
    if (previous.eth !== null) {
      const prev = BigInt(previous.eth);
      const curr = BigInt(currentEth);
      balanceDelta = (curr - prev).toString();
    }
    
    // Update stored balance
    this.balances.set(normalized, {
      eth: currentEth,
      tokens: previous.tokens
    });
    
    return {
      address,
      balanceBefore: previous.eth || '0',
      balanceAfter: currentEth,
      balanceDelta,
      balanceDeltaEth: ethers.formatEther(balanceDelta)
    };
  }

  /**
   * Initialize balance for an address
   */
  async initializeBalance(address) {
    const normalized = address.toLowerCase();
    const ethBalance = await this.getEthBalance(address);
    
    this.balances.set(normalized, {
      eth: ethBalance,
      tokens: {}
    });
    
    return {
      address,
      ethBalance,
      ethBalanceFormatted: ethers.formatEther(ethBalance)
    };
  }

  /**
   * Get current balance for an address
   */
  getBalance(address) {
    const normalized = address.toLowerCase();
    return this.balances.get(normalized) || { eth: null, tokens: {} };
  }
}

module.exports = BalanceTracker;

