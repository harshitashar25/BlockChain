# Quick Start (Without Docker)

## Prerequisites

- ✅ Node.js 18+ (you have v23.11.0)
- ✅ Neo4j installed (already installed)
- ✅ npm installed (you have v10.9.2)

## Step 1: Create .env File

Create a `.env` file in the root directory:

```bash
# Neo4j Configuration
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=neo4j

# Server Configuration
PORT=4000
NODE_ENV=development

# Bank Adapter Mock
MOCK_BANK_URL=http://localhost:4001
MOCK_BANK_API_KEY=mock_bank_key

# Exchange Adapter Mock
MOCK_EXCHANGE_URL=http://localhost:4002
MOCK_EXCHANGE_API_KEY=mock_exchange_key
```

## Step 2: Start Neo4j

```bash
neo4j start
```

Wait a few seconds, then verify:
```bash
curl http://localhost:7474
```

Access Neo4j Browser: http://localhost:7474
- Default login: `neo4j` / `neo4j` (change password on first login)

## Step 3: Start All Services

### Option A: Use the startup script (Recommended)

```bash
./start-services.sh
```

This will start all services in the background. Press Ctrl+C to stop.

### Option B: Start manually (4 separate terminals)

**Terminal 1 - Backend:**
```bash
cd backend
npm install  # if not already done
npm start
```

**Terminal 2 - Mock Bank:**
```bash
cd tools/mock_bank
npm install  # if not already done
npm start
```

**Terminal 3 - Mock Exchange:**
```bash
cd tools/mock_exchange
npm install  # if not already done
npm start
```

**Terminal 4 - Frontend:**
```bash
cd frontend
npm install  # if not already done
npm start
```

## Step 4: Verify Services

Check all services are running:

```bash
# Backend
curl http://localhost:4000/health

# Mock Bank
curl http://localhost:4001/api/bank/health

# Mock Exchange
curl http://localhost:4002/api/exchange/health

# Neo4j
curl http://localhost:7474
```

## Step 5: Access the UI

Open your browser:
- **Frontend UI**: http://localhost:3000
- **Neo4j Browser**: http://localhost:7474

## Step 6: Run E2E Demo

In a new terminal:

```bash
cd ETH_FraudDetection_System
node demo/runner.js
```

This will run the complete end-to-end flow:
1. Fetch UTR from bank
2. Query exchange LEA
3. Fetch on-chain transfers
4. Ingest to Neo4j
5. Stitch identities
6. Trace paths
7. Submit evidence
8. Request freeze
9. Approve freeze
10. Place bank hold

## Troubleshooting

### Neo4j Connection Issues

```bash
# Check Neo4j status
neo4j status

# Restart Neo4j
neo4j restart

# Check if port 7687 is in use
lsof -i :7687
```

### Port Already in Use

If a port is already in use, you can change it:

- **Backend (4000)**: Set `PORT=4001` in `.env`
- **Mock Bank (4001)**: Edit `tools/mock_bank/server.js`
- **Mock Exchange (4002)**: Edit `tools/mock_exchange/server.js`
- **Frontend (3000)**: React will auto-use 3001 if 3000 is busy

### Stop All Services

If you used the startup script:
```bash
# Press Ctrl+C in the terminal running start-services.sh
```

Or manually kill processes:
```bash
# Find and kill Node processes
pkill -f "node.*server.js"  # Backend and mocks
pkill -f "react-scripts"    # Frontend
```

## Next Steps

1. **Generate Keys** (for evidence signing):
   ```bash
   ./scripts/generate_keys.sh
   ```

2. **Test the System**:
   - Open http://localhost:3000
   - Navigate to "Bank Report" and submit a case
   - Check "LEA Queue" to approve freezes
   - Use "Investigator Trace" to visualize paths

3. **View Graph in Neo4j**:
   - Open http://localhost:7474
   - Run: `MATCH (n) RETURN n LIMIT 25`

## Notes

- Kafka and MinIO are **optional** for PoC - the system has fallbacks
- Moralis API key is **optional** - synthetic data will be used if not provided
- All services can run independently - no Docker required!

