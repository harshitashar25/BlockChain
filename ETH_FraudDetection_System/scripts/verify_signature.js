#!/usr/bin/env node

/**
 * Verify signature of an evidence bundle
 * Usage: node verify_signature.js <evidence.json> <base64_signature>
 */

const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

const args = process.argv.slice(2);

if (args.length < 2) {
  console.error('Usage: node verify_signature.js <evidence.json> <base64_signature>');
  process.exit(1);
}

const evidenceFile = args[0];
const base64Signature = args[1];

// Read evidence file
if (!fs.existsSync(evidenceFile)) {
  console.error(`❌ Error: Evidence file not found: ${evidenceFile}`);
  process.exit(1);
}

const evidenceContent = fs.readFileSync(evidenceFile, 'utf8');

// Read public key
const keysDir = path.join(__dirname, '..', 'keys');
const publicKeyPath = path.join(keysDir, 'public_key.pem');

if (!fs.existsSync(publicKeyPath)) {
  console.error(`❌ Error: Public key not found: ${publicKeyPath}`);
  console.error('   Run ./scripts/generate_keys.sh first');
  process.exit(1);
}

const publicKey = fs.readFileSync(publicKeyPath, 'utf8');

try {
  // Create SHA256 hash of evidence
  const hash = crypto.createHash('sha256').update(evidenceContent).digest();

  // Decode base64 signature
  const signature = Buffer.from(base64Signature, 'base64');

  // Verify signature
  const verify = crypto.createVerify('RSA-SHA256');
  verify.update(hash);
  const isValid = verify.verify(publicKey, signature);

  if (isValid) {
    console.log('✅ Signature verification: PASSED');
    console.log(`   Evidence file: ${evidenceFile}`);
    console.log(`   Hash: ${hash.toString('hex')}`);
    process.exit(0);
  } else {
    console.error('❌ Signature verification: FAILED');
    console.error('   The signature does not match the evidence bundle.');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Error during verification:', error.message);
  process.exit(1);
}

