#!/usr/bin/env node
/**
 * Diagnostic script to check all dependencies for trace-and-update
 * Run this before testing trace to identify issues
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function checkService(name, url, method = 'GET', data = null) {
  try {
    const config = {
      method,
      url,
      timeout: 5000,
      ...(data && { data })
    };
    const response = await axios(config);
    return { ok: true, status: response.status, data: response.data };
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      return { ok: false, error: 'Service not running', code: 'ECONNREFUSED' };
    }
    if (error.response) {
      return { ok: false, error: `HTTP ${error.response.status}`, data: error.response.data };
    }
    return { ok: false, error: error.message };
  }
}

async function checkNeo4j() {
  const USE_MEMORY = process.env.USE_MEMORY_GRAPH === 'true' || !process.env.NEO4J_URI;
  if (USE_MEMORY) {
    log('✅ Using in-memory graph (no Neo4j needed)', 'green');
    return { ok: true, mode: 'memory' };
  }

  const uri = process.env.NEO4J_URI || 'bolt://localhost:7687';
  const user = process.env.NEO4J_USER || 'neo4j';
  const password = process.env.NEO4J_PASSWORD;

  if (!password) {
    log('❌ NEO4J_PASSWORD not set in .env', 'red');
    return { ok: false, error: 'NEO4J_PASSWORD missing' };
  }

  try {
    const neo4j = require('neo4j-driver');
    const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
    const session = driver.session();
    const result = await session.run('RETURN 1 AS ok');
    await session.close();
    await driver.close();
    log(`✅ Neo4j connected: ${uri}`, 'green');
    return { ok: true, uri };
  } catch (error) {
    log(`❌ Neo4j connection failed: ${error.message}`, 'red');
    return { ok: false, error: error.message };
  }
}

async function main() {
  log('\n🔍 DIAGNOSTIC: Trace-and-Update Dependencies\n', 'blue');

  // 1. Check Backend
  log('\n1️⃣  Checking Backend API...', 'blue');
  const backendUrl = process.env.API_BASE_URL || 'http://localhost:4000';
  const backendCheck = await checkService('Backend', `${backendUrl}/api/health`);
  if (backendCheck.ok) {
    log(`   ✅ Backend reachable: ${backendUrl}`, 'green');
  } else {
    log(`   ❌ Backend not reachable: ${backendCheck.error}`, 'red');
    log(`   💡 Start backend: cd backend && npm start`, 'yellow');
  }

  // 2. Check Mock Bank
  log('\n2️⃣  Checking Mock Bank Service...', 'blue');
  const bankUrl = process.env.MOCK_BANK_URL || 'http://localhost:4001';
  const bankCheck = await checkService('Mock Bank', `${bankUrl}/api/bank/utr/UTR-FREEZE-001`);
  if (bankCheck.ok || bankCheck.error === 'HTTP 404') {
    log(`   ✅ Mock Bank reachable: ${bankUrl}`, 'green');
  } else {
    log(`   ❌ Mock Bank not reachable: ${bankCheck.error}`, 'red');
    log(`   💡 Start mock bank: cd tools/mock_bank && node server.js`, 'yellow');
  }

  // 3. Check Mock Exchange
  log('\n3️⃣  Checking Mock Exchange Service...', 'blue');
  const exchangeUrl = process.env.MOCK_EXCHANGE_URL || 'http://localhost:4002';
  const exchangeCheck = await checkService('Mock Exchange', `${exchangeUrl}/api/exchange/lea/query`, 'POST', {
    utr: 'UTR-FREEZE-001',
    bank_account_hash: 'test'
  });
  if (exchangeCheck.ok || (exchangeCheck.error && exchangeCheck.error.includes('HTTP'))) {
    log(`   ✅ Mock Exchange reachable: ${exchangeUrl}`, 'green');
  } else {
    log(`   ❌ Mock Exchange not reachable: ${exchangeCheck.error}`, 'red');
    log(`   💡 Start mock exchange: cd tools/mock_exchange && node server.js`, 'yellow');
  }

  // 4. Check Neo4j / Memory Graph
  log('\n4️⃣  Checking Graph Database...', 'blue');
  const graphCheck = await checkNeo4j();
  if (!graphCheck.ok) {
    log(`   ⚠️  Graph issue: ${graphCheck.error}`, 'yellow');
    log(`   💡 Set USE_MEMORY_GRAPH=true in .env to use in-memory graph`, 'yellow');
  }

  // 5. Check Moralis API Key
  log('\n5️⃣  Checking Moralis API...', 'blue');
  const moralisKey = process.env.MORALIS_API_KEY;
  if (moralisKey) {
    log(`   ✅ MORALIS_API_KEY is set (${moralisKey.slice(0, 10)}...)`, 'green');
    // Test API call
    try {
      const testResponse = await axios.get(
        `https://deep-index.moralis.io/api/v2/0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb/erc20/transfers?chain=eth&limit=1`,
        {
          headers: { 'X-API-Key': moralisKey },
          timeout: 5000
        }
      );
      log(`   ✅ Moralis API working (status: ${testResponse.status})`, 'green');
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        log(`   ❌ Moralis API key invalid or expired`, 'red');
      } else if (error.response?.status === 429) {
        log(`   ⚠️  Moralis rate limit hit`, 'yellow');
      } else {
        log(`   ⚠️  Moralis API error: ${error.message}`, 'yellow');
      }
    }
  } else {
    log(`   ⚠️  MORALIS_API_KEY not set (will use synthetic data)`, 'yellow');
  }

  // 6. Check Fabric Client Storage
  log('\n6️⃣  Checking Fabric Client Storage...', 'blue');
  const fabricStoragePath = path.join(__dirname, '../backend/data/fabric_cases.json');
  try {
    if (fs.existsSync(fabricStoragePath)) {
      const data = JSON.parse(fs.readFileSync(fabricStoragePath, 'utf8'));
      const caseCount = data.cases?.length || 0;
      log(`   ✅ Fabric storage exists (${caseCount} cases)`, 'green');
    } else {
      log(`   ⚠️  Fabric storage file not found (will be created)`, 'yellow');
    }
  } catch (error) {
    log(`   ⚠️  Fabric storage issue: ${error.message}`, 'yellow');
  }

  // 7. Test Complete Trace Endpoint
  log('\n7️⃣  Testing Trace Endpoint...', 'blue');
  if (backendCheck.ok) {
    try {
      const traceResponse = await axios.post(
        `${backendUrl}/api/freeze/trace-and-update`,
        {
          caseId: 'CASE-DIAG-TEST',
          utr: 'UTR-FREEZE-001'
        },
        { timeout: 30000 }
      );
      if (traceResponse.data.ok) {
        log(`   ✅ Trace endpoint working! Found ${traceResponse.data.asset_refs?.length || 0} assets`, 'green');
      } else {
        log(`   ⚠️  Trace endpoint returned error: ${traceResponse.data.error}`, 'yellow');
      }
    } catch (error) {
      if (error.response) {
        log(`   ❌ Trace endpoint error: ${error.response.status} - ${error.response.data?.error || error.response.data?.message || 'Unknown'}`, 'red');
        if (error.response.data?.step) {
          log(`   📍 Failed at step: ${error.response.data.step}`, 'yellow');
        }
      } else {
        log(`   ❌ Trace endpoint timeout or connection error: ${error.message}`, 'red');
      }
    }
  } else {
    log(`   ⏭️  Skipping (backend not reachable)`, 'yellow');
  }

  // Summary
  log('\n📊 SUMMARY\n', 'blue');
  const allChecks = [
    backendCheck.ok,
    bankCheck.ok || bankCheck.error === 'HTTP 404',
    exchangeCheck.ok || (exchangeCheck.error && exchangeCheck.error.includes('HTTP')),
    graphCheck.ok || process.env.USE_MEMORY_GRAPH === 'true',
    true // Moralis is optional
  ];

  const passed = allChecks.filter(Boolean).length;
  const total = allChecks.length;

  if (passed === total) {
    log(`✅ All critical services are running! (${passed}/${total})`, 'green');
    log(`\n🎯 You can now test trace-and-update in the UI!`, 'green');
  } else {
    log(`⚠️  Some services are not running (${passed}/${total} passed)`, 'yellow');
    log(`\n💡 Fix the issues above, then try again.`, 'yellow');
  }

  log('\n');
}

main().catch(error => {
  log(`\n❌ Diagnostic script error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});

