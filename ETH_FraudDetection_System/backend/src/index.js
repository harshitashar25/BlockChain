const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

// Import routes
const moralisRoutes = require('./routes/moralis');
const graphRoutes = require('./routes/graph');
const bridgeRoutes = require('./routes/bridge');
const tracerRoutes = require('./routes/tracer');
const fabricRoutes = require('./routes/fabric');
const bankHoldRoutes = require('./routes/bankHold');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

// Routes
app.use('/api/moralis', moralisRoutes);
app.use('/api/graph', graphRoutes);
app.use('/api/bridge', bridgeRoutes);
app.use('/api/tracer', tracerRoutes);
app.use('/api/fabric', fabricRoutes);
app.use('/api/bank-hold', bankHoldRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    ok: true,
    timestamp: new Date().toISOString(),
    service: 'fraud-trail-backend',
    version: '1.0.0'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Fraud Trail Backend',
    version: '1.0.0',
    description: 'Permissioned blockchain fraud-trail system',
    endpoints: {
      health: '/health',
      moralis: '/api/moralis'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Fraud Trail Backend running on port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 Moralis API: http://localhost:${PORT}/api/moralis`);
});

