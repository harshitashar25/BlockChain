const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4002;

// Middleware
app.use(cors());
app.use(express.json());

// Load synthetic dataset (fallback to in-memory if file not found)
let syntheticData = null;
const datasetPath = path.join(__dirname, '../../demo/synthetic_dataset.json');

try {
  if (fs.existsSync(datasetPath)) {
    syntheticData = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));
    console.log(`✅ Loaded synthetic dataset: ${syntheticData.p2p_orders?.length || 0} P2P orders`);
  }
} catch (error) {
  console.warn('⚠️  Could not load synthetic dataset, using in-memory data');
}

// Mock P2P order database (can be replaced with real exchange API)
const p2pOrders = {};
const utrToOrderMap = {};

// Initialize from synthetic dataset if available
if (syntheticData && syntheticData.p2p_orders) {
  syntheticData.p2p_orders.forEach(order => {
    const orderKey = order.order_id || order.utr;
    p2pOrders[orderKey] = {
      order_id: order.order_id,
      buyer_kyc: order.buyer_kyc || {
        name: order.buyer?.name || 'Unknown',
        email: order.buyer?.email || '',
        phone: order.buyer?.phone || '',
        kyc_status: 'VERIFIED',
        kyc_level: 'LEVEL_2',
        document_hash: crypto.createHash('sha256').update(`KYC-${order.order_id}`).digest('hex'),
        verified_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      },
      withdrawal_wallet: order.withdrawal_wallet,
      amount: order.amount || order.amount_inr,
      currency: order.currency || 'INR',
      crypto_amount: order.crypto_amount,
      crypto_currency: order.crypto_currency || 'ETH',
      order_timestamp: order.order_timestamp || new Date().toISOString(),
      status: order.status || 'COMPLETED'
    };
    
    // Map UTR to order
    if (order.utr) {
      utrToOrderMap[order.utr] = orderKey;
    }
    
    // Map seller account hash to order
    if (order.seller_account_hash) {
      utrToOrderMap[order.seller_account_hash] = orderKey;
    }
  });
} else {
  // Fallback in-memory data
  p2pOrders['P2P-ORDER-001'] = {
    order_id: 'P2P-ORDER-001',
    buyer_kyc: {
      name: 'Alice Crypto',
      email: 'alice@example.com',
      phone: '+91-9876543210',
      kyc_status: 'VERIFIED',
      kyc_level: 'LEVEL_2',
      document_hash: crypto.createHash('sha256').update('KYC-DOC-001').digest('hex'),
      verified_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    },
    withdrawal_wallet: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    amount: 100000,
    currency: 'INR',
    crypto_amount: '0.5',
    crypto_currency: 'ETH',
    order_timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    status: 'COMPLETED'
  };
  utrToOrderMap['UTR123456789'] = 'P2P-ORDER-001';
}

// Mock mapping: bank_account_hash -> order
const accountHashToOrder = {};

/**
 * POST /api/exchange/lea/query
 * LEA query endpoint - returns P2P order and buyer KYC
 * Body: { utr } OR { bank_account_hash }
 * Production: Replace with real exchange LEA API endpoint (requires legal authorization)
 */
app.post('/api/exchange/lea/query', (req, res) => {
  const { utr, bank_account_hash } = req.body;

  if (!utr && !bank_account_hash) {
    return res.status(400).json({
      error: 'Missing required field: utr or bank_account_hash'
    });
  }

  let orderKey = null;

  // Try to find order by UTR first
  if (utr) {
    orderKey = utrToOrderMap[utr];
  }

  // If not found, try by bank_account_hash
  if (!orderKey && bank_account_hash) {
    orderKey = utrToOrderMap[bank_account_hash] || accountHashToOrder[bank_account_hash];
    
    // Try partial match (hash suffix)
    if (!orderKey) {
      const hashSuffix = bank_account_hash.split(':').pop();
      orderKey = Object.keys(utrToOrderMap).find(key => 
        key.includes(hashSuffix) || hashSuffix.includes(key.split(':').pop())
      );
      if (orderKey) {
        orderKey = utrToOrderMap[orderKey];
      }
    }
  }

  // Look up order
  const order = orderKey ? p2pOrders[orderKey] : null;

  if (!order) {
    return res.status(404).json({
      ok: false,
      error: 'P2P order not found',
      utr: utr || null,
      bank_account_hash: bank_account_hash || null
    });
  }

  // Return LEA packet format
  res.json({
    ok: true,
    order: {
      order_id: order.order_id,
      buyer_kyc: order.buyer_kyc,
      withdrawal_wallet: order.withdrawal_wallet,
      amount: order.amount,
      currency: order.currency,
      crypto_amount: order.crypto_amount,
      crypto_currency: order.crypto_currency,
      order_timestamp: order.order_timestamp,
      status: order.status
    },
    query_timestamp: new Date().toISOString(),
    lea_request_id: `LEA-${Date.now()}`
  });
});

/**
 * GET /api/exchange/lea/order/:orderId
 * Get order details by order ID
 */
app.get('/api/exchange/lea/order/:orderId', (req, res) => {
  const { orderId } = req.params;

  // Find order by order_id
  const order = p2pOrders[orderId];

  if (!order) {
    return res.status(404).json({
      error: 'Order not found',
      order_id: orderId
    });
  }

  // Find UTR for this order
  const utr = Object.keys(utrToOrderMap).find(key => utrToOrderMap[key] === orderId);

  res.json({
    ok: true,
    utr: utr || null,
    order: order
  });
});

/**
 * GET /api/exchange/health
 * Health check
 */
app.get('/api/exchange/health', (req, res) => {
  res.json({
    ok: true,
    service: 'mock-exchange-adapter',
    version: '1.0.0',
    mode: process.env.USE_REAL_EXCHANGE_API === 'true' ? 'production' : 'mock',
    order_count: Object.keys(p2pOrders).length
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Mock Exchange Adapter running on port ${PORT}`);
  console.log(`🌐 Health: http://localhost:${PORT}/api/exchange/health`);
  console.log(`📚 Endpoints:`);
  console.log(`   POST /api/exchange/lea/query`);
  console.log(`   GET  /api/exchange/lea/order/:orderId`);
  console.log(`\n💡 Production swap: Set USE_REAL_EXCHANGE_API=true and configure real exchange LEA endpoint`);
  console.log(`⚠️  Legal: Real exchange LEA access requires FIR/court order per exchange policy`);
});
