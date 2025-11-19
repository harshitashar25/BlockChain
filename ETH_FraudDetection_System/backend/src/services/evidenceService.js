const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

/**
 * Evidence Service - Creates and signs evidence bundles
 * In production, swap OpenSSL for HSM/KMS signing
 */
class EvidenceService {
  constructor() {
    this.kmsType = process.env.KMS_TYPE || 'openssl';
    this.privateKeyPath = process.env.KMS_KEY_PATH || path.join(__dirname, '../../keys/private_key.pem');
    this.publicKeyPath = process.env.KMS_PUBLIC_KEY_PATH || path.join(__dirname, '../../keys/public_key.pem');
  }

  /**
   * Create an evidence bundle from case data
   * @param {object} caseData - Case information
   * @param {string} caseData.caseId - Case ID
   * @param {object} caseData.utrData - UTR data from bank
   * @param {object} caseData.exchangeData - Exchange LEA data
   * @param {Array} caseData.transferEvents - On-chain transfer events
   * @param {Array} caseData.tracePaths - Tracer results
   * @returns {object} Evidence bundle
   */
  createEvidenceBundle(caseData) {
    const bundle = {
      case_id: caseData.caseId,
      created_at: new Date().toISOString(),
      version: '1.0',
      utr_data: caseData.utrData,
      exchange_data: caseData.exchangeData,
      transfer_events: caseData.transferEvents || [],
      trace_paths: caseData.tracePaths || [],
      metadata: {
        tracer_version: '1.0',
        evidence_type: 'fraud_trail'
      }
    };

    // Calculate evidence hash (SHA-256)
    const bundleString = JSON.stringify(bundle, null, 2);
    const evidenceHash = crypto.createHash('sha256').update(bundleString).digest('hex');

    bundle.evidence_hash = evidenceHash;

    return {
      bundle: bundle,
      evidence_hash: evidenceHash,
      bundle_string: bundleString
    };
  }

  /**
   * Sign an evidence bundle
   * @param {string} bundleString - JSON string of evidence bundle
   * @returns {Promise<string>} Base64-encoded signature
   */
  async signBundle(bundleString) {
    if (this.kmsType === 'openssl') {
      return this._signWithOpenSSL(bundleString);
    } else if (this.kmsType === 'aws') {
      return this._signWithAWSKMS(bundleString);
    } else {
      throw new Error(`Unsupported KMS type: ${this.kmsType}`);
    }
  }

  /**
   * Sign using OpenSSL (PoC)
   * @private
   */
  async _signWithOpenSSL(bundleString) {
    const { execSync } = require('child_process');
    const tmpFile = path.join(__dirname, '../../tmp_evidence.json');
    const sigFile = path.join(__dirname, '../../tmp_evidence.sig');

    try {
      // Write bundle to temp file
      fs.writeFileSync(tmpFile, bundleString);

      // Create hash
      const hash = crypto.createHash('sha256').update(bundleString).digest();

      // Sign with private key
      if (!fs.existsSync(this.privateKeyPath)) {
        throw new Error(`Private key not found: ${this.privateKeyPath}. Run scripts/generate_keys.sh first.`);
      }

      const privateKey = fs.readFileSync(this.privateKeyPath, 'utf8');
      const sign = crypto.createSign('RSA-SHA256');
      sign.update(hash);
      const signature = sign.sign(privateKey, 'base64');

      return signature;
    } finally {
      // Cleanup temp files
      if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
      if (fs.existsSync(sigFile)) fs.unlinkSync(sigFile);
    }
  }

  /**
   * Sign using AWS KMS (production)
   * @private
   */
  async _signWithAWSKMS(bundleString) {
    // TODO: Implement AWS KMS signing
    // const AWS = require('aws-sdk');
    // const kms = new AWS.KMS({ region: process.env.AWS_REGION });
    // const hash = crypto.createHash('sha256').update(bundleString).digest();
    // const result = await kms.sign({
    //   KeyId: process.env.AWS_KMS_KEY_ID,
    //   Message: hash,
    //   MessageType: 'DIGEST',
    //   SigningAlgorithm: 'RSASSA_PKCS1_V1_5_SHA_256'
    // }).promise();
    // return result.Signature.toString('base64');
    throw new Error('AWS KMS signing not yet implemented');
  }

  /**
   * Verify a signature
   * @param {string} bundleString - JSON string of evidence bundle
   * @param {string} base64Signature - Base64-encoded signature
   * @returns {Promise<boolean>} True if signature is valid
   */
  async verifySignature(bundleString, base64Signature) {
    if (!fs.existsSync(this.publicKeyPath)) {
      throw new Error(`Public key not found: ${this.publicKeyPath}`);
    }

    const publicKey = fs.readFileSync(this.publicKeyPath, 'utf8');
    const hash = crypto.createHash('sha256').update(bundleString).digest();
    const signature = Buffer.from(base64Signature, 'base64');

    const verify = crypto.createVerify('RSA-SHA256');
    verify.update(hash);
    return verify.verify(publicKey, signature);
  }
}

module.exports = EvidenceService;

