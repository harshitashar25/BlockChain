const express = require('express');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');
const bodyParser = require('body-parser');
require('dotenv').config();

const WalletTracker = require('./services/walletTracker');
const TransactionTrail = require('./services/transactionTrail');

// Import routes
const trackRoutes = require('./routes/track');
const transactionRoutes = require('./routes/transactions');
const webhookRoutes = require('./routes/webhooks');
const blockchainRoutes = require('./routes/blockchain');
const trailRoutes = require('./routes/trail');
const intelligenceRoutes = require('./routes/intelligence');

const app = express();
const server = http.createServer(app);

// WebSocket server for real-time updates
const wss = new WebSocket.Server({ server });

// Store active WebSocket connections
const clients = new Set();

// Initialize wallet tracker
const rpcUrl = process.env.ETHEREUM_RPC_URL || 'https://eth.llamarpc.com';
const wsUrl = process.env.ETHEREUM_WS_URL || null;
const chainName = process.env.CHAIN_NAME || 'ethereum';

let walletTracker = null;
let transactionTrail = null;

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log('✅ Client connected to WebSocket');
  clients.add(ws);
  
  // Send current status on connection
  if (walletTracker) {
    const tracked = walletTracker.getTrackedAddresses();
    ws.send(JSON.stringify({
      type: 'CONNECTED',
      data: {
        trackedAddresses: Array.isArray(tracked.addresses) ? tracked.addresses : [],
        trackedContracts: Array.isArray(tracked.contracts) ? tracked.contracts : [],
        chain: chainName
      }
    }));

    // Get current block
    walletTracker.getCurrentBlock().then(blockNumber => {
      ws.send(JSON.stringify({
        type: 'BLOCK_UPDATE',
        data: { blockNumber, chain: chainName }
      }));
    });
  }

  ws.on('close', () => {
    console.log('❌ Client disconnected');
    clients.delete(ws);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      // Handle client messages if needed
      console.log('Received message from client:', data);
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  });
});

// Broadcast function to send updates to all connected clients
function broadcast(data) {
  const message = JSON.stringify(data);
  let sentCount = 0;
  
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(message);
        sentCount++;
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
      }
    }
  });
  
  if (sentCount > 0) {
    console.log(`📡 Broadcasted to ${sentCount} client(s)`);
  }
}

// Make broadcast available globally
global.broadcastWalletUpdate = broadcast;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

// Routes
app.use('/api/track', trackRoutes.router);
app.use('/api/transactions', transactionRoutes.router);
app.use('/api/webhooks', webhookRoutes.router);
app.use('/api/blockchain', blockchainRoutes.router);
app.use('/api/trail', trailRoutes.router);
app.use('/api/intelligence', intelligenceRoutes.router);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    chain: chainName,
    trackedAddresses: walletTracker ? walletTracker.getTrackedAddresses().addresses.length : 0
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Blockchain Monitoring Service',
    version: '1.0.0',
    description: 'Real-time blockchain monitoring from scratch',
    endpoints: {
      health: '/health',
      track: '/api/track',
      transactions: '/api/transactions',
      webhooks: '/api/webhooks',
      blockchain: '/api/blockchain'
    },
    websocket: 'ws://localhost:' + (process.env.PORT || 5000)
  });
});

const PORT = process.env.PORT || 5000;

// Initialize wallet tracker and start server
async function start() {
  try {
    console.log('🚀 Initializing Blockchain Monitoring Service...');
    console.log(`📍 Chain: ${chainName}`);
    console.log(`🔗 RPC URL: ${rpcUrl}`);
    console.log(`🔌 WebSocket: ${wsUrl ? 'Enabled' : 'Disabled (using polling)'}`);
    
    // Create wallet tracker
    walletTracker = new WalletTracker(rpcUrl, wsUrl, chainName);
    
    // Create transaction trail
    transactionTrail = new TransactionTrail();
    
    // Set wallet tracker in routes
    trackRoutes.setWalletTracker(walletTracker);
    transactionRoutes.setWalletTracker(walletTracker);
    webhookRoutes.setWalletTracker(walletTracker);
    blockchainRoutes.setWalletTracker(walletTracker);
    trailRoutes.setWalletTracker(walletTracker);
    trailRoutes.setTransactionTrail(transactionTrail);
    transactionRoutes.setTransactionTrail(transactionTrail);
    
    // Hook transaction trail into wallet tracker
    // When transactions are detected, add them to the trail
    const originalHandleTransaction = walletTracker.handleTransaction.bind(walletTracker);
    walletTracker.handleTransaction = async (txData, receipt) => {
      await originalHandleTransaction(txData, receipt);
      // Add to transaction trail
      transactionTrail.addTransaction(txData);
    };
    
    // Initialize and start monitoring
    await walletTracker.initialize();
    
    server.listen(PORT, () => {
      console.log(`\n✅ Server running on port ${PORT}`);
      console.log(`📡 WebSocket server ready: ws://localhost:${PORT}`);
      console.log(`🌐 HTTP API: http://localhost:${PORT}`);
      console.log(`🔍 Blockchain monitoring active for ${chainName}`);
      console.log(`\n📚 API Documentation:`);
      console.log(`   GET  /health - Health check`);
      console.log(`   POST /api/track/address - Add address to track`);
      console.log(`   GET  /api/track/addresses - List tracked addresses`);
      console.log(`   GET  /api/transactions - Get recent transactions`);
      console.log(`   POST /api/webhooks/config - Configure webhook`);
      console.log(`   GET  /api/blockchain/status - Get system status`);
      console.log(`\n🎯 Ready to monitor blockchain transactions!\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');
  if (walletTracker) {
    walletTracker.monitor.stop();
  }
  wss.close(() => {
    server.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
  });
});

// Start the server
start();

