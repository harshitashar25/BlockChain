const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4001;

// Middleware
app.use(cors());
app.use(express.json());

// Load synthetic dataset (fallback to in-memory if file not found)
let syntheticData = null;
const datasetPath = path.join(__dirname, '../../demo/synthetic_dataset.json');

try {
  if (fs.existsSync(datasetPath)) {
    syntheticData = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));
    console.log(`✅ Loaded synthetic dataset: ${syntheticData.utrs?.length || 0} UTRs`);
  }
} catch (error) {
  console.warn('⚠️  Could not load synthetic dataset, using in-memory data');
}

// In-memory store for UTR data (mock database - can be replaced with real DB)
const utrDatabase = {};

// Initialize from synthetic dataset if available
if (syntheticData && syntheticData.utrs) {
  syntheticData.utrs.forEach(utrRecord => {
    utrDatabase[utrRecord.utr] = {
      utr: utrRecord.utr,
      remitter: {
        name: utrRecord.remitter.name,
        account_hash: utrRecord.remitter.account_hash || 
          crypto.createHash('sha256').update(utrRecord.remitter.account || '').digest('hex'),
        phone: utrRecord.remitter.phone,
        pan_token: utrRecord.remitter.pan_token || 
          crypto.createHash('sha256').update(utrRecord.remitter.pan || '').digest('hex'),
        downstream: utrRecord.downstream || []
      },
      amount: utrRecord.amount,
      currency: utrRecord.currency || 'INR',
      timestamp: utrRecord.timestamp || new Date().toISOString()
    };
  });
} else {
  // Fallback in-memory data
  utrDatabase['UTR123456789'] = {
    utr: 'UTR123456789',
    remitter: {
      name: 'John Doe',
      account_hash: crypto.createHash('sha256').update('ACCOUNT123456').digest('hex'),
      phone: '+91-9876543210',
      pan_token: crypto.createHash('sha256').update('ABCDE1234F').digest('hex'),
      downstream: []
    },
    amount: 100000,
    timestamp: new Date().toISOString()
  };
}

// In-memory store for holds
const holds = {};

/**
 * Generate a mock signature for the payload
 * In production, this would use HSM/KMS
 * Production swap: Replace with AWS KMS Sign API or HSM PKCS#11
 */
function signPayload(payload) {
  // For PoC, use a simple HMAC
  // Production: Use HSM/KMS signing
  const secret = process.env.BANK_SIGNING_SECRET || 'mock-bank-secret-key';
  const payloadString = JSON.stringify(payload);
  const signature = crypto.createHmac('sha256', secret).update(payloadString).digest('hex');
  return signature;
}

/**
 * GET /api/bank/utr/:utr
 * Fetch UTR details with signed payload
 * Production: Replace with real bank API endpoint
 */
app.get('/api/bank/utr/:utr', (req, res) => {
  const { utr } = req.params;

  if (!utrDatabase[utr]) {
    return res.status(404).json({
      error: 'UTR not found',
      utr: utr
    });
  }

  const utrData = utrDatabase[utr];
  const payload = {
    utr: utrData.utr,
    remitter: utrData.remitter,
    amount: utrData.amount,
    currency: utrData.currency || 'INR',
    timestamp: utrData.timestamp
  };

  const signature = signPayload(payload);

  res.json({
    ok: true,
    payload: payload,
    signature: signature,
    signed_at: new Date().toISOString()
  });
});

/**
 * POST /api/bank/hold
 * Place a hold on an asset/account
 * Body: { caseId, assetRef, evidenceHash }
 * Production: Replace with real bank hold API (MTLS required)
 */
app.post('/api/bank/hold', (req, res) => {
  const { caseId, assetRef, evidenceHash } = req.body;

  if (!caseId || !assetRef || !evidenceHash) {
    return res.status(400).json({
      error: 'Missing required fields: caseId, assetRef, evidenceHash'
    });
  }

  // Generate hold ID
  const holdId = `HOLD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Store hold
  holds[holdId] = {
    hold_id: holdId,
    case_id: caseId,
    asset_ref: assetRef,
    evidence_hash: evidenceHash,
    status: 'HOLD_PLACED',
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
  };

  console.log(`✅ Hold placed: ${holdId} for case ${caseId}`);

  res.json({
    ok: true,
    status: 'HOLD_PLACED',
    hold_id: holdId,
    case_id: caseId,
    asset_ref: assetRef,
    created_at: holds[holdId].created_at
  });
});

/**
 * GET /api/bank/hold/:holdId
 * Get hold status
 */
app.get('/api/bank/hold/:holdId', (req, res) => {
  const { holdId } = req.params;

  if (!holds[holdId]) {
    return res.status(404).json({
      error: 'Hold not found',
      hold_id: holdId
    });
  }

  res.json({
    ok: true,
    hold: holds[holdId]
  });
});

/**
 * DELETE /api/bank/hold/:holdId
 * Release a hold (for testing)
 */
app.delete('/api/bank/hold/:holdId', (req, res) => {
  const { holdId } = req.params;

  if (!holds[holdId]) {
    return res.status(404).json({
      error: 'Hold not found'
    });
  }

  holds[holdId].status = 'RELEASED';
  holds[holdId].released_at = new Date().toISOString();

  res.json({
    ok: true,
    status: 'RELEASED',
    hold_id: holdId
  });
});

/**
 * GET /api/bank/health
 * Health check
 */
app.get('/api/bank/health', (req, res) => {
  res.json({
    ok: true,
    service: 'mock-bank-adapter',
    version: '1.0.0',
    mode: process.env.USE_REAL_BANK_API === 'true' ? 'production' : 'mock',
    utr_count: Object.keys(utrDatabase).length,
    active_holds: Object.values(holds).filter(h => h.status === 'HOLD_PLACED').length
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Mock Bank Adapter running on port ${PORT}`);
  console.log(`🌐 Health: http://localhost:${PORT}/api/bank/health`);
  console.log(`📚 Endpoints:`);
  console.log(`   GET  /api/bank/utr/:utr`);
  console.log(`   POST /api/bank/hold`);
  console.log(`   GET  /api/bank/hold/:holdId`);
  console.log(`\n💡 Production swap: Set USE_REAL_BANK_API=true and configure real bank endpoint`);
});
