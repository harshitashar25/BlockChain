const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

/**
 * Bank Hold Service - Automates bank hold requests
 * Supports MTLS and signed bundles for production
 */
class BankHoldService {
  constructor() {
    this.bankUrl = process.env.MOCK_BANK_URL || 'http://localhost:4001';
    this.apiKey = process.env.MOCK_BANK_API_KEY || 'mock_bank_key';
    this.useMTLS = process.env.USE_MTLS === 'true';
    
    // MTLS configuration (for production)
    if (this.useMTLS) {
      this.clientCert = process.env.MTLS_CLIENT_CERT_PATH;
      this.clientKey = process.env.MTLS_CLIENT_KEY_PATH;
      this.caCert = process.env.MTLS_CA_CERT_PATH;
    }
  }

  /**
   * Place a hold on an asset/account
   * @param {string} caseId - Case ID
   * @param {string} assetRef - Asset reference (account hash, wallet address, etc.)
   * @param {string} evidenceHash - Evidence bundle hash
   * @param {string} evidenceBundleUrl - URL to evidence bundle (optional)
   * @returns {Promise<object>} Hold response
   */
  async placeHold(caseId, assetRef, evidenceHash, evidenceBundleUrl = null) {
    const payload = {
      caseId: caseId,
      assetRef: assetRef,
      evidenceHash: evidenceHash,
      evidenceBundleUrl: evidenceBundleUrl
    };

    // Create signed bundle if needed
    const signature = await this._signRequest(payload);

    const headers = {
      'Content-Type': 'application/json',
      'X-API-Key': this.apiKey,
      'X-Request-ID': crypto.randomUUID(),
      'Date': new Date().toUTCString()
    };

    if (signature) {
      headers['X-Signature'] = signature;
    }

    try {
      const config = {
        method: 'POST',
        url: `${this.bankUrl}/api/bank/hold`,
        data: payload,
        headers: headers
      };

      // Add MTLS configuration if enabled
      if (this.useMTLS && this.clientCert && this.clientKey) {
        config.httpsAgent = this._createMTLSAgent();
      }

      const response = await axios(config);

      return {
        ok: true,
        status: response.data.status,
        hold_id: response.data.hold_id,
        case_id: response.data.case_id,
        created_at: response.data.created_at
      };
    } catch (error) {
      console.error('Error placing bank hold:', error.message);
      throw new Error(`Failed to place bank hold: ${error.message}`);
    }
  }

  /**
   * Get hold status
   */
  async getHoldStatus(holdId) {
    try {
      const response = await axios.get(`${this.bankUrl}/api/bank/hold/${holdId}`, {
        headers: {
          'X-API-Key': this.apiKey
        }
      });

      return response.data.hold;
    } catch (error) {
      console.error('Error fetching hold status:', error.message);
      throw new Error(`Failed to fetch hold status: ${error.message}`);
    }
  }

  /**
   * Sign request payload (for production)
   * @private
   */
  async _signRequest(payload) {
    // In production: Use HSM/KMS to sign
    // For PoC: Return null (mock bank doesn't require signature)
    
    if (process.env.KMS_TYPE === 'openssl') {
      // Use OpenSSL signing
      const payloadString = JSON.stringify(payload);
      const privateKeyPath = process.env.KMS_KEY_PATH || path.join(__dirname, '../../keys/private_key.pem');
      
      if (fs.existsSync(privateKeyPath)) {
        const privateKey = fs.readFileSync(privateKeyPath, 'utf8');
        const sign = crypto.createSign('RSA-SHA256');
        sign.update(payloadString);
        return sign.sign(privateKey, 'base64');
      }
    }

    return null;
  }

  /**
   * Create HTTPS agent with MTLS (for production)
   * @private
   */
  _createMTLSAgent() {
    const https = require('https');
    
    return new https.Agent({
      cert: fs.readFileSync(this.clientCert),
      key: fs.readFileSync(this.clientKey),
      ca: this.caCert ? fs.readFileSync(this.caCert) : undefined,
      rejectUnauthorized: true
    });
  }
}

module.exports = BankHoldService;

