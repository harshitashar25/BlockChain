const axios = require('axios');
require('dotenv').config();

/**
 * Moralis Client for fetching on-chain transfer events
 * Converts Moralis API responses to canonical TransferEvent format
 */
class MoralisClient {
  constructor() {
    this.apiKey = process.env.MORALIS_API_KEY;
    this.baseURL = 'https://deep-index.moralis.io/api/v2.2';
    
    if (!this.apiKey) {
      console.warn('⚠️  MORALIS_API_KEY not set. Will use synthetic data fallback.');
    }
  }

  /**
   * Fetch transfers for an address
   * @param {string} address - Wallet address
   * @param {string} chain - Chain identifier (eth, bsc, tron, polygon, etc.)
   * @param {object} options - Additional options (limit, cursor, etc.)
   * @returns {Promise<Array>} Array of canonical TransferEvent objects
   */
  async getTransfers(address, chain = 'eth', options = {}) {
    const { limit = 100, cursor = null } = options;

    if (!this.apiKey) {
      // Return synthetic data for PoC
      return this._generateSyntheticTransfers(address, chain);
    }

    try {
      const url = `${this.baseURL}/${address}/erc20/transfers`;
      const params = {
        chain: chain,
        limit: limit
      };
      
      if (cursor) {
        params.cursor = cursor;
      }

      const response = await axios.get(url, {
        headers: {
          'X-API-Key': this.apiKey,
          'Accept': 'application/json'
        },
        params
      });

      const transfers = response.data.result || [];
      return transfers.map(tx => this._canonicalizeTransferEvent(tx, chain));

    } catch (error) {
      console.error(`Error fetching transfers from Moralis: ${error.message}`);
      if (error.response?.status === 401) {
        console.warn('Invalid Moralis API key. Falling back to synthetic data.');
        return this._generateSyntheticTransfers(address, chain);
      }
      throw error;
    }
  }

  /**
   * Canonicalize a Moralis transfer event to standard format
   * @param {object} moralisTx - Raw Moralis transfer object
   * @param {string} chain - Chain identifier
   * @returns {object} Canonical TransferEvent
   */
  _canonicalizeTransferEvent(moralisTx, chain) {
    // Extract token decimals (default to 18 for ETH)
    const decimals = moralisTx.token_decimals || 18;
    const amount = moralisTx.value || '0';
    
    // Convert amount from wei/smallest unit to human-readable
    const amountDecimal = this._fromWei(amount, decimals);

    // Generate canonical event_id
    const eventId = `moralis-${moralisTx.transaction_hash}-${moralisTx.log_index || 0}`;

    // Canonical TransferEvent format
    return {
      event_id: eventId,
      chain: chain,
      tx_hash: moralisTx.transaction_hash,
      block_number: moralisTx.block_number,
      timestamp: moralisTx.block_timestamp || new Date().toISOString(),
      from: moralisTx.from_address?.toLowerCase() || '',
      to: moralisTx.to_address?.toLowerCase() || '',
      token_address: moralisTx.token_address?.toLowerCase() || '',
      token_symbol: moralisTx.token_symbol || 'ETH',
      token_name: moralisTx.token_name || 'Ethereum',
      amount: amountDecimal,
      amount_raw: amount,
      decimals: decimals,
      log_index: moralisTx.log_index || 0,
      source: 'moralis'
    };
  }

  /**
   * Convert from wei/smallest unit to decimal
   * @param {string} value - Value in smallest unit
   * @param {number} decimals - Token decimals
   * @returns {string} Human-readable decimal amount
   */
  _fromWei(value, decimals) {
    const valueBN = BigInt(value);
    const divisor = BigInt(10 ** decimals);
    const quotient = valueBN / divisor;
    const remainder = valueBN % divisor;
    
    if (remainder === 0n) {
      return quotient.toString();
    }
    
    const remainderStr = remainder.toString().padStart(decimals, '0');
    const trimmed = remainderStr.replace(/0+$/, '');
    return `${quotient}.${trimmed}`;
  }

  /**
   * Generate synthetic transfer events for PoC when Moralis key is not available
   * @param {string} address - Wallet address
   * @param {string} chain - Chain identifier
   * @returns {Array} Array of synthetic TransferEvent objects
   */
  _generateSyntheticTransfers(address, chain) {
    console.log(`📝 Generating synthetic transfers for ${address} on ${chain}`);
    
    const synthetic = [
      {
        event_id: `synthetic-${chain}-${address.slice(0, 10)}-1`,
        chain: chain,
        tx_hash: `0x${Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`,
        block_number: Math.floor(Math.random() * 1000000) + 18000000,
        timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        from: address.toLowerCase(),
        to: `0x${Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`,
        token_address: '0x0000000000000000000000000000000000000000',
        token_symbol: chain === 'eth' ? 'ETH' : 'BNB',
        token_name: chain === 'eth' ? 'Ethereum' : 'Binance Coin',
        amount: (Math.random() * 10).toFixed(4),
        amount_raw: (Math.random() * 10 * 1e18).toString(),
        decimals: 18,
        log_index: 0,
        source: 'synthetic'
      }
    ];

    return synthetic;
  }

  /**
   * Get native token transfers (ETH, BNB, etc.)
   * @param {string} address - Wallet address
   * @param {string} chain - Chain identifier
   * @param {object} options - Additional options
   * @returns {Promise<Array>} Array of canonical TransferEvent objects
   */
  async getNativeTransfers(address, chain = 'eth', options = {}) {
    if (!this.apiKey) {
      return this._generateSyntheticTransfers(address, chain);
    }

    try {
      const url = `${this.baseURL}/${address}/native/transfers`;
      const params = {
        chain: chain,
        limit: options.limit || 100
      };

      const response = await axios.get(url, {
        headers: {
          'X-API-Key': this.apiKey,
          'Accept': 'application/json'
        },
        params
      });

      const transfers = response.data.result || [];
      return transfers.map(tx => this._canonicalizeNativeTransfer(tx, chain));

    } catch (error) {
      console.error(`Error fetching native transfers: ${error.message}`);
      return this._generateSyntheticTransfers(address, chain);
    }
  }

  /**
   * Canonicalize native token transfer
   */
  _canonicalizeNativeTransfer(moralisTx, chain) {
    const decimals = 18;
    const amount = moralisTx.value || '0';
    const amountDecimal = this._fromWei(amount, decimals);
    const eventId = `moralis-native-${moralisTx.hash}-0`;

    return {
      event_id: eventId,
      chain: chain,
      tx_hash: moralisTx.hash,
      block_number: moralisTx.block_number,
      timestamp: moralisTx.block_timestamp || new Date().toISOString(),
      from: moralisTx.from_address?.toLowerCase() || '',
      to: moralisTx.to_address?.toLowerCase() || '',
      token_address: '0x0000000000000000000000000000000000000000',
      token_symbol: chain === 'eth' ? 'ETH' : 'BNB',
      token_name: chain === 'eth' ? 'Ethereum' : 'Binance Coin',
      amount: amountDecimal,
      amount_raw: amount,
      decimals: decimals,
      log_index: 0,
      source: 'moralis'
    };
  }
}

module.exports = MoralisClient;

