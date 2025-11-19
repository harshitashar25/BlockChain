const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 4002;

// Middleware
app.use(cors());
app.use(express.json());

// Mock P2P order database
const p2pOrders = {
  'UTR123456789': {
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
  },
  'UTR987654321': {
    order_id: 'P2P-ORDER-002',
    buyer_kyc: {
      name: 'Bob Trader',
      email: 'bob@example.com',
      phone: '+91-9876543211',
      kyc_status: 'VERIFIED',
      kyc_level: 'LEVEL_1',
      document_hash: crypto.createHash('sha256').update('KYC-DOC-002').digest('hex'),
      verified_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
    },
    withdrawal_wallet: '0x8ba1f109551bD432803012645Hac136c22C9C',
    amount: 25000,
    currency: 'INR',
    crypto_amount: '0.125',
    crypto_currency: 'ETH',
    order_timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    status: 'COMPLETED'
  }
};

// Mock mapping: bank_account_hash -> order
const accountHashToOrder = {
  'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3': 'UTR123456789', // hash of ACCOUNT123456
  'b3a3e5574d1c5b5c5b5c5b5c5b5c5b5c5b5c5b5c5b5c5b5c5b5c5b5c5b5c5b5c5b': 'UTR987654321'  // hash of ACCOUNT789012
};

/**
 * POST /api/exchange/lea/query
 * LEA query endpoint - returns P2P order and buyer KYC
 * Body: { utr } OR { bank_account_hash }
 */
app.post('/api/exchange/lea/query', (req, res) => {
  const { utr, bank_account_hash } = req.body;

  if (!utr && !bank_account_hash) {
    return res.status(400).json({
      error: 'Missing required field: utr or bank_account_hash'
    });
  }

  let orderKey = utr;

  // If bank_account_hash provided, look up UTR
  if (bank_account_hash && !utr) {
    orderKey = accountHashToOrder[bank_account_hash];
    if (!orderKey) {
      return res.status(404).json({
        ok: false,
        error: 'No P2P order found for the provided bank account hash',
        bank_account_hash: bank_account_hash
      });
    }
  }

  // Look up order
  const order = p2pOrders[orderKey];

  if (!order) {
    return res.status(404).json({
      ok: false,
      error: 'P2P order not found',
      utr: orderKey
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
  const orderEntry = Object.entries(p2pOrders).find(([_, order]) => order.order_id === orderId);

  if (!orderEntry) {
    return res.status(404).json({
      error: 'Order not found',
      order_id: orderId
    });
  }

  const [utr, order] = orderEntry;

  res.json({
    ok: true,
    utr: utr,
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
});

