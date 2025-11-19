#!/usr/bin/env node

/**
 * End-to-end demo runner
 * Simulates full fraud trail flow using mocks and synthetic data
 */

const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const API_BASE = process.env.API_BASE || 'http://localhost:4000';
const BANK_API = process.env.MOCK_BANK_URL || 'http://localhost:4001';
const EXCHANGE_API = process.env.MOCK_EXCHANGE_URL || 'http://localhost:4002';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function step1_fetchBankUTR(utr) {
  log('\n📋 Step 1: Fetch UTR from Bank', 'blue');
  try {
    const response = await axios.get(`${BANK_API}/api/bank/utr/${utr}`);
    log(`✅ UTR fetched: ${utr}`, 'green');
    log(`   Remitter: ${response.data.payload.remitter.name}`);
    log(`   Amount: ${response.data.payload.amount}`);
    return response.data;
  } catch (error) {
    log(`❌ Error fetching UTR: ${error.message}`, 'red');
    throw error;
  }
}

async function step2_fetchExchangeLEA(utr) {
  log('\n📋 Step 2: Query Exchange LEA', 'blue');
  try {
    const response = await axios.post(`${EXCHANGE_API}/api/exchange/lea/query`, {
      utr: utr
    });
    log(`✅ Exchange LEA response received`, 'green');
    log(`   Order ID: ${response.data.order.order_id}`);
    log(`   Withdrawal Wallet: ${response.data.order.withdrawal_wallet}`);
    return response.data;
  } catch (error) {
    log(`❌ Error querying exchange: ${error.message}`, 'red');
    throw error;
  }
}

async function step3_fetchOnChainTransfers(walletAddress) {
  log('\n📋 Step 3: Fetch On-Chain Transfers (Moralis)', 'blue');
  try {
    const response = await axios.get(`${API_BASE}/api/moralis/address/${walletAddress}/transfers`, {
      params: { chain: 'eth' },
      headers: process.env.MORALIS_API_KEY ? { 'X-API-Key': process.env.MORALIS_API_KEY } : {}
    });
    log(`✅ Transfers fetched: ${response.data.count} events`, 'green');
    return response.data.transfers;
  } catch (error) {
    log(`⚠️  Moralis API error (using synthetic data): ${error.message}`, 'yellow');
    // Return synthetic data
    return [{
      event_id: 'synthetic-1',
      chain: 'eth',
      from: walletAddress,
      to: '0x' + Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
      amount: '0.5',
      token_symbol: 'ETH',
      timestamp: new Date().toISOString()
    }];
  }
}

async function step4_ingestToNeo4j(transferEvents) {
  log('\n📋 Step 4: Ingest Transfers to Neo4j', 'blue');
  try {
    for (const event of transferEvents) {
      await axios.post(`${API_BASE}/api/graph/ingest`, event);
    }
    log(`✅ Ingested ${transferEvents.length} transfer events`, 'green');
  } catch (error) {
    log(`❌ Error ingesting to Neo4j: ${error.message}`, 'red');
    throw error;
  }
}

async function step5_stitchIdentities(utrData, exchangeData) {
  log('\n📋 Step 5: Stitch Identities (Bank → Exchange → Wallet)', 'blue');
  try {
    const bankAccountHash = utrData.payload.remitter.account_hash;
    const exchangeOrderId = exchangeData.order.order_id;
    const walletAddress = exchangeData.order.withdrawal_wallet;

    // Stitch bank to wallet (via exchange)
    await axios.post(`${API_BASE}/api/graph/stitch/exchange`, {
      exchangeOrderId: exchangeOrderId,
      walletAddress: walletAddress
    });

    log(`✅ Identity stitched: bank → exchange → wallet`, 'green');
    return { bankAccountHash, exchangeOrderId, walletAddress };
  } catch (error) {
    log(`❌ Error stitching identities: ${error.message}`, 'red');
    throw error;
  }
}

async function step6_tracePath(walletAddress) {
  log('\n📋 Step 6: Trace Path to Exchange', 'blue');
  try {
    const seed = `chain:${walletAddress.toLowerCase()}`;
    const response = await axios.get(`${API_BASE}/api/tracer/trace`, {
      params: {
        seed: seed,
        depth: 6,
        hours: 48,
        minAmt: 100
      }
    });

    const result = response.data.result;
    log(`✅ Trace completed`, 'green');
    log(`   Paths found: ${result.total_paths}`);
    log(`   Exchange endpoints: ${result.exchange_endpoints.length}`);
    
    if (result.exchange_endpoints.length > 0) {
      log(`   Endpoints: ${result.exchange_endpoints.join(', ')}`, 'yellow');
    }

    return result;
  } catch (error) {
    log(`❌ Error tracing: ${error.message}`, 'red');
    throw error;
  }
}

async function step7_submitEvidence(caseId, evidenceHash, traceResult) {
  log('\n📋 Step 7: Submit Evidence to Fabric', 'blue');
  try {
    const response = await axios.post(`${API_BASE}/api/fabric/submit-evidence`, {
      caseId: caseId,
      evidenceHash: evidenceHash,
      requester: 'demo-runner'
    });

    log(`✅ Evidence submitted: ${caseId}`, 'green');
    log(`   Evidence Hash: ${evidenceHash}`);
    return response.data.case;
  } catch (error) {
    log(`❌ Error submitting evidence: ${error.message}`, 'red');
    throw error;
  }
}

async function step8_requestFreeze(caseId, assetRef) {
  log('\n📋 Step 8: Request Freeze', 'blue');
  try {
    const response = await axios.post(`${API_BASE}/api/fabric/request-freeze`, {
      caseId: caseId,
      assetRef: assetRef
    });

    log(`✅ Freeze requested for asset: ${assetRef}`, 'green');
    return response.data.case;
  } catch (error) {
    log(`❌ Error requesting freeze: ${error.message}`, 'red');
    throw error;
  }
}

async function step9_approveFreeze(caseId, approvers) {
  log('\n📋 Step 9: Approve Freeze (N-of-M)', 'blue');
  try {
    for (let i = 0; i < approvers.length; i++) {
      const approver = approvers[i];
      log(`   Approving with ${approver}...`, 'yellow');
      
      const response = await axios.post(`${API_BASE}/api/fabric/approve-freeze`, {
        caseId: caseId,
        approver: approver
      });

      if (response.data.freeze_activated) {
        log(`✅ Freeze activated after ${i + 1} approvals!`, 'green');
        return response.data.case;
      }
      
      await sleep(1000);
    }

    return null;
  } catch (error) {
    log(`❌ Error approving freeze: ${error.message}`, 'red');
    throw error;
  }
}

async function step10_placeBankHold(caseId, assetRef, evidenceHash) {
  log('\n📋 Step 10: Place Bank Hold', 'blue');
  try {
    const response = await axios.post(`${API_BASE}/api/bank-hold/place`, {
      caseId: caseId,
      assetRef: assetRef,
      evidenceHash: evidenceHash
    });

    log(`✅ Bank hold placed: ${response.data.result.hold_id}`, 'green');
    log(`   Status: ${response.data.result.status}`);
    return response.data.result;
  } catch (error) {
    log(`❌ Error placing bank hold: ${error.message}`, 'red');
    throw error;
  }
}

async function main() {
  log('\n🚀 Fraud Trail E2E Demo Runner', 'blue');
  log('='.repeat(50), 'blue');

  // Use synthetic dataset
  const utr = 'UTR123456789';
  const caseId = `CASE-${Date.now()}`;

  try {
    // Step 1: Fetch UTR from bank
    const utrData = await step1_fetchBankUTR(utr);

    // Step 2: Query exchange LEA
    const exchangeData = await step2_fetchExchangeLEA(utr);

    // Step 3: Fetch on-chain transfers
    const walletAddress = exchangeData.order.withdrawal_wallet;
    const transfers = await step3_fetchOnChainTransfers(walletAddress);

    // Step 4: Ingest to Neo4j
    await step4_ingestToNeo4j(transfers);

    // Step 5: Stitch identities
    const identities = await step5_stitchIdentities(utrData, exchangeData);

    // Step 6: Trace path
    const traceResult = await step6_tracePath(walletAddress);

    // Step 7: Create evidence bundle and submit
    const evidenceHash = crypto.createHash('sha256')
      .update(JSON.stringify({ caseId, utrData, exchangeData, traceResult }))
      .digest('hex');
    
    await step7_submitEvidence(caseId, evidenceHash, traceResult);

    // Step 8: Request freeze
    await step8_requestFreeze(caseId, identities.walletAddress);

    // Step 9: Approve freeze (2-of-3)
    const approvers = ['lea-approver-001', 'lea-approver-002'];
    const freezeCase = await step9_approveFreeze(caseId, approvers);

    // Step 10: Place bank hold (triggered by FreezeActivated event)
    if (freezeCase && freezeCase.freeze_active) {
      await sleep(2000); // Wait for event processing
      await step10_placeBankHold(caseId, identities.walletAddress, evidenceHash);
    }

    log('\n✅ E2E Demo Completed Successfully!', 'green');
    log('='.repeat(50), 'blue');

    // Write summary
    const summary = {
      case_id: caseId,
      evidence_hash: evidenceHash,
      utr: utr,
      wallet_address: walletAddress,
      trace_paths: traceResult.total_paths,
      exchange_endpoints: traceResult.exchange_endpoints,
      completed_at: new Date().toISOString()
    };

    const summaryPath = path.join(__dirname, 'demo_summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    log(`\n📄 Summary written to: ${summaryPath}`, 'blue');

  } catch (error) {
    log(`\n❌ Demo failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { main };

