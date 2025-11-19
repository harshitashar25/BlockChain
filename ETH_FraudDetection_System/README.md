# Fraud Trail System - Permissioned Blockchain Fraud Detection

A complete permissioned blockchain fraud-trail system for banks and exchanges, with end-to-end evidence tracking, graph-based path tracing, and automated freeze workflows.

## 🏗️ Architecture

- **Backend**: Node.js/Express API with Neo4j graph database
- **Blockchain**: Hyperledger Fabric for evidence immutability
- **Streaming**: Kafka for event ingestion
- **Storage**: MinIO for evidence bundles
- **On-chain Data**: Moralis API for blockchain enrichment
- **Frontend**: React with force graph visualization

## 📋 Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- OpenSSL (for key generation)

### Step 1: Setup Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env and add your MORALIS_API_KEY (optional for PoC)
```

### Step 2: Start Infrastructure

```bash
# Start Neo4j, Kafka, MinIO
docker compose up -d

# Wait for services to be healthy
docker compose ps
```

**Note**: If you don't have Docker installed:
- **macOS**: Install [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- **Linux**: `sudo apt-get install docker.io docker-compose-plugin` (or equivalent)
- **Alternative**: You can run Neo4j, Kafka, and MinIO separately without Docker (see below)

### Step 3: Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install

# Mock services
cd ../tools/mock_bank
npm install

cd ../mock_exchange
npm install
```

### Step 4: Generate Keys

```bash
# Generate RSA keypair for evidence signing
./scripts/generate_keys.sh
```

### Step 5: Start Services

```bash
# Terminal 1: Backend
cd backend
npm start

# Terminal 2: Mock Bank
cd tools/mock_bank
npm start

# Terminal 3: Mock Exchange
cd tools/mock_exchange
npm start

# Terminal 4: Frontend
cd frontend
npm start
```

### Step 6: Run E2E Demo

```bash
# Run the demo runner
node demo/runner.js
```

## 🧪 Testing

### Health Checks

```bash
# Backend
curl http://localhost:4000/health

# Neo4j
curl http://localhost:7474

# Mock Bank
curl http://localhost:4001/api/bank/health

# Mock Exchange
curl http://localhost:4002/api/exchange/health
```

### Test Moralis Integration

```bash
curl "http://localhost:4000/api/moralis/address/0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb/transfers?chain=eth"
```

### Test Graph Ingestion

```bash
curl -X POST http://localhost:4000/api/graph/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "event_id": "test-1",
    "chain": "eth",
    "from": "0xabc123...",
    "to": "0xdef456...",
    "amount": "1.5",
    "token_symbol": "ETH",
    "timestamp": "2024-01-15T10:00:00Z"
  }'
```

### Test Tracer

```bash
curl "http://localhost:4000/api/tracer/trace?seed=chain:0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb&depth=6&hours=48"
```

## 📚 API Endpoints

### Backend API (Port 4000)

- `GET /health` - Health check
- `GET /api/moralis/address/:address/transfers` - Fetch transfers
- `POST /api/graph/ingest` - Ingest transfer event
- `POST /api/graph/stitch/bank` - Stitch bank identity
- `POST /api/graph/stitch/exchange` - Stitch exchange identity
- `GET /api/tracer/trace` - Trace paths from seed
- `POST /api/fabric/submit-evidence` - Submit evidence
- `POST /api/fabric/request-freeze` - Request freeze
- `POST /api/fabric/approve-freeze` - Approve freeze
- `POST /api/bank-hold/place` - Place bank hold

### Mock Bank API (Port 4001)

- `GET /api/bank/utr/:utr` - Get UTR details
- `POST /api/bank/hold` - Place hold
- `GET /api/bank/hold/:holdId` - Get hold status

### Mock Exchange API (Port 4002)

- `POST /api/exchange/lea/query` - LEA query
- `GET /api/exchange/lea/order/:orderId` - Get order details

## 🔐 Security Notes

- **PoC**: Uses OpenSSL for signing (file-based keys)
- **Production**: Must use HSM/KMS (AWS KMS, CloudHSM)
- **MTLS**: Required for bank/exchange production integrations
- **PII**: Must be tokenized before Neo4j storage
- **Keys**: Never commit keys or `.env` files

## 🔄 Production Migration

See `infra/mtls-setup.md` for MTLS configuration.

### Swap Mocks for Production

1. **Bank Integration**:
   - Replace `MOCK_BANK_URL` with bank's LEA API endpoint
   - Configure MTLS certificates
   - Update API contract per bank's spec

2. **Exchange Integration**:
   - Replace `MOCK_EXCHANGE_URL` with exchange's LEA endpoint
   - Follow exchange's LEA packet format
   - Obtain required legal approvals (FIR/court order)

3. **Fabric Network**:
   - Deploy chaincode to consortium network
   - Configure MSP and CA per Hyperledger docs
   - Set up multi-org peers

4. **Signing**:
   - Replace OpenSSL with AWS KMS or CloudHSM
   - Implement PKCS#11 for HSM access
   - Rotate keys every 90 days

## 📖 Documentation

- `SETUP.md` - Detailed setup guide
- `infra/mtls-setup.md` - MTLS configuration
- `demo/synthetic_dataset.json` - Sample data
- `infra/bridgeRegistry.json` - Bridge contract registry

## 🎯 Acceptance Criteria

✅ Evidence bundle hashed and signature verified  
✅ Evidence hash stored in Fabric (or file for PoC)  
✅ Tracer finds paths to exchange endpoints  
✅ Freeze flow: Approve → Activate → Bank Hold  
✅ UI displays case timeline, graph, and evidence  
✅ Audit log records all actions  
✅ E2E demo runs without real bank/exchange  

## 📝 License

Internal use only. See legal requirements for production deployment.
