# 🎯 What We Built: Complete Fraud Detection System

## 📋 Overview

We built a **complete fraud detection and investigation system** that connects:
- **Banks** (off-chain transactions via UTR)
- **Blockchain** (on-chain transactions via Ethereum)
- **Exchanges** (crypto-to-fiat conversions)

The system traces fraud across all three layers to find where stolen money goes.

---

## 🏗️ System Architecture

```
┌─────────────┐
│   Frontend   │  React UI for Investigators
│  (Port 3000) │  - Dashboard, Trace, Evidence Viewer
└──────┬───────┘
       │
       ▼
┌─────────────────────────────────────────────────────────┐
│              Backend API (Port 4000)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Moralis    │  │    Graph     │  │    Tracer    │  │
│  │   Client     │  │  (Neo4j/    │  │  (Path       │  │
│  │              │  │   Memory)    │  │  Finding)    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
       │                    │                    │
       ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Moralis    │    │    Neo4j     │    │  Hyperledger │
│     API      │    │   Database   │    │    Fabric    │
│ (Blockchain  │    │  (Graph DB)  │    │ (Evidence    │
│    Data)     │    │              │    │  Storage)    │
└──────────────┘    └──────────────┘    └──────────────┘
       │
       ▼
┌──────────────┐
│   Ethereum   │
│  Blockchain  │
└──────────────┘

┌──────────────┐    ┌──────────────┐
│  Mock Bank   │    │ Mock Exchange│
│  (Port 4001) │    │  (Port 4002) │
└──────────────┘    └──────────────┘
```

---

## 🔧 Components We Built

### 1. **Frontend (React UI)** ✅

**Location**: `frontend/src/`

**What it does**:
- **Dashboard**: Overview of fraud cases
- **Investigator Trace**: Visual graph showing money flow
- **Bank Report**: Form to report fraud
- **LEA Queue**: Law enforcement case queue
- **Evidence Viewer**: View evidence bundles

**Key Features**:
- Interactive force-directed graph visualization
- Real-time path tracing
- Beautiful, modern UI with Ant Design

**Files**:
- `App.js` - Main app with navigation
- `components/InvestigatorTrace.js` - Graph visualization
- `components/Dashboard.js` - Main dashboard
- `components/BankReport.js` - Fraud reporting form

---

### 2. **Backend API (Node.js/Express)** ✅

**Location**: `backend/src/`

**What it does**:
- REST API for all operations
- Connects to Moralis, Neo4j, Fabric
- Handles graph ingestion and tracing
- Manages evidence bundles

**Key Endpoints**:
```
GET  /health                                    - Health check
GET  /api/moralis/address/:address/transfers    - Fetch blockchain transfers
POST /api/moralis/fetch-and-ingest              - Fetch & ingest transfers
POST /api/moralis/trace-from-address            - Fetch, ingest, and trace
GET  /api/tracer/trace                          - Trace paths in graph
POST /api/graph/ingest                          - Ingest transfer event
POST /api/graph/stitch/bank                     - Link bank account to wallet
POST /api/graph/stitch/exchange                 - Link exchange account
POST /api/fabric/submit-evidence                - Store evidence on blockchain
GET  /api/graph/debug/stats                     - Graph statistics
```

**Files**:
- `index.js` - Main Express server
- `routes/moralis.js` - Moralis API endpoints
- `routes/moralisIngest.js` - Fetch & ingest endpoints
- `routes/tracer.js` - Path tracing endpoints
- `routes/graph.js` - Graph operations
- `routes/fabric.js` - Blockchain evidence storage

---

### 3. **Moralis Integration** ✅

**Location**: `backend/src/services/moralisClient.js`

**What it does**:
- Fetches **real blockchain data** from Moralis API
- Gets ERC20 token transfers
- Gets native ETH transfers
- Converts to standard format

**How it works**:
1. Takes a wallet address
2. Calls Moralis API: `GET /{address}/erc20/transfers`
3. Also fetches native transfers: `GET /{address}/native/transfers`
4. Returns canonical transfer events

**Example**:
```javascript
const client = new MoralisClient();
const transfers = await client.getTransfers('0x742d35...', 'eth', { limit: 100 });
// Returns: [{ from, to, amount, token_symbol, timestamp, ... }]
```

---

### 4. **Graph Database (Neo4j + In-Memory Fallback)** ✅

**Location**: `backend/src/graph/`

**What it does**:
- Stores **actors** (wallets, bank accounts, exchanges)
- Stores **relationships** (transfers between actors)
- Enables fast path finding

**Graph Structure**:
```
(chain:0xABC) -[SENT]-> (chain:0xDEF)
(bank:12345) -[SENT]-> (chain:0xABC)
(chain:0xDEF) -[SENT]-> (exchange:binance)
```

**Two Modes**:
1. **Neo4j** (production): Real graph database
2. **In-Memory** (PoC): JavaScript Map/Set (no setup needed)

**Files**:
- `neo4jClient.js` - Neo4j connection
- `memoryGraphClient.js` - In-memory graph
- `sharedMemoryGraph.js` - Singleton for in-memory

**Operations**:
- `upsertActor(id, props)` - Create/update actor
- `ingestTransferEvent(event)` - Add transfer relationship
- `getOutgoingRelationships(actorId, timeWindow, minAmount)` - Get transfers

---

### 5. **Tracer (Path Finding Algorithm)** ✅

**Location**: `backend/src/tracer/`

**What it does**:
- Finds **all paths** from a seed address
- Uses **Priority-BFS** algorithm
- Shows where money flows

**How it works**:
1. Start from seed address (e.g., `chain:0x742d35...`)
2. Explore outgoing transfers
3. Prioritize by: `risk_score × amount`
4. Continue up to depth limit
5. Return all discovered paths

**Algorithm**:
```javascript
queue = [seed]
visited = {seed}
paths = []

while queue not empty:
  current = pop highest priority from queue
  if current is exchange: save path
  for each outgoing transfer:
    next = transfer.to
    if not visited:
      add to queue
      save path
```

**Files**:
- `tracer.js` - Neo4j tracer
- `memoryTracer.js` - In-memory tracer

**Recent Fix**: Now shows **ALL paths**, not just exchange endpoints!

---

### 6. **Identity Stitching** ✅

**Location**: `backend/src/routes/graph.js`

**What it does**:
- Links **bank accounts** to **wallet addresses**
- Links **exchange accounts** to **wallet addresses**
- Creates unified identity graph

**Example**:
```
Bank Account: 12345 (UTR: ABC123)
    ↓ stitch
Wallet: 0x742d35... (received funds)
    ↓ stitch
Exchange: binance_user_789 (withdrew to bank)
```

**Endpoints**:
- `POST /api/graph/stitch/bank` - Link bank → wallet
- `POST /api/graph/stitch/exchange` - Link exchange → wallet

---

### 7. **Evidence Service** ✅

**Location**: `backend/src/services/evidenceService.js`

**What it does**:
- Creates **evidence bundles** (JSON with all case data)
- **Hashes** evidence (SHA-256)
- **Signs** evidence (RSA signature)
- Stores hash in Hyperledger Fabric

**Evidence Bundle Structure**:
```json
{
  "case_id": "CASE-2024-001",
  "timestamp": "2024-01-15T10:00:00Z",
  "reporter": "Bank A",
  "fraud_details": {...},
  "graph_paths": [...],
  "on_chain_evidence": [...],
  "hash": "0xabc123...",
  "signature": "base64-signature..."
}
```

**Files**:
- `evidenceService.js` - Bundle creation
- `scripts/sign_bundle.sh` - Signing script
- `scripts/verify_signature.js` - Verification

---

### 8. **Hyperledger Fabric Integration** ✅

**Location**: `backend/src/services/fabricClient.js`, `fabric/chaincode/`

**What it does**:
- Stores **immutable evidence hashes** on permissioned blockchain
- Only authorized parties can read/write
- Provides audit trail

**Chaincode** (Go):
- `SubmitEvidence(caseId, hash)` - Store evidence hash
- `GetEvidence(caseId)` - Retrieve evidence hash
- `RequestFreeze(caseId)` - Request asset freeze
- `ApproveFreeze(caseId)` - Approve freeze request

**Files**:
- `fabric/chaincode/fraudchain.go` - Smart contract
- `backend/src/services/fabricClient.js` - Fabric client

---

### 9. **Mock Services** ✅

**Location**: `tools/mock_bank/`, `tools/mock_exchange/`

**What it does**:
- Simulates **real bank** API
- Simulates **real exchange** API
- Allows testing without real integrations

**Mock Bank** (Port 4001):
- `GET /api/bank/utr/:utr` - Get UTR details
- `POST /api/bank/hold` - Place hold on account

**Mock Exchange** (Port 4002):
- `POST /api/exchange/lea/query` - LEA query
- `GET /api/exchange/lea/order/:orderId` - Get order

**Files**:
- `tools/mock_bank/server.js`
- `tools/mock_exchange/server.js`

---

### 10. **Bridge Watcher** ✅

**Location**: `backend/src/services/bridgeWatcher.js`

**What it does**:
- Detects **cross-chain bridge transfers**
- Tracks money moving between chains (ETH → BSC, etc.)
- Maintains bridge contract registry

**Example**:
```
Ethereum: 0xABC → Bridge Contract → BSC: 0xDEF
```

**Files**:
- `bridgeWatcher.js` - Bridge detection logic
- `infra/bridgeRegistry.json` - Known bridge contracts

---

## 🔄 Data Flow: How It All Works Together

### Scenario: Tracing Fraud from Bank to Exchange

**Step 1: Bank Reports Fraud**
```
Bank → POST /api/bank/report
  → Creates case
  → Stores UTR details
```

**Step 2: Fetch Blockchain Data**
```
Investigator enters wallet address: 0x742d35...
  → Frontend calls: POST /api/moralis/trace-from-address
  → Backend calls Moralis API
  → Fetches ERC20 + native transfers
  → Returns transfer events
```

**Step 3: Ingest into Graph**
```
Backend ingests transfers:
  → For each transfer: graph.ingestTransferEvent(transfer)
  → Creates actors: chain:0xABC, chain:0xDEF
  → Creates relationships: (chain:0xABC)-[SENT]->(chain:0xDEF)
```

**Step 4: Fetch Related Addresses**
```
Backend fetches transfers for destination addresses:
  → Gets transfers for 0xDEF (where money went)
  → Gets transfers for 0xDEF's destinations
  → Builds 2-level deep graph
```

**Step 5: Trace Paths**
```
Tracer runs Priority-BFS:
  → Starts from chain:0x742d35...
  → Explores all outgoing transfers
  → Finds paths to exchanges, other wallets
  → Returns all paths
```

**Step 6: Visualize**
```
Frontend receives paths:
  → Converts to graph format (nodes + edges)
  → Renders with ForceGraph2D
  → Shows interactive visualization
```

**Step 7: Stitch Identities**
```
Investigator links:
  → Bank account → Wallet (via UTR)
  → Wallet → Exchange (via P2P order)
  → Creates complete fraud trail
```

**Step 8: Create Evidence**
```
System creates evidence bundle:
  → Includes all paths, transfers, identities
  → Hashes bundle (SHA-256)
  → Signs with RSA key
  → Stores hash in Fabric
```

---

## 🐛 Problems We Fixed

### 1. **"Found 0 paths" Issue** ✅

**Problem**: Tracer only showed paths ending at `exchange:` endpoints, but Moralis creates `chain:` actors.

**Fix**:
- Modified tracer to show **ALL paths**, not just exchanges
- Shows paths at max depth
- Shows leaf nodes (addresses with no outgoing transfers)

**Files Changed**:
- `backend/src/tracer/tracer.js`
- `backend/src/tracer/memoryTracer.js`

---

### 2. **Empty Graph Issue** ✅

**Problem**: Graph was empty because:
- Only fetching 1 transfer wasn't enough
- Not fetching transfers for destination addresses
- Too strict filters (100 ETH minimum, 48 hours)

**Fix**:
- Fetches **both ERC20 AND native transfers**
- Fetches transfers for **destination addresses (2 levels deep)**
- Lowered minimum amount: **0.01 ETH** (was 100)
- Increased time window: **7 days** (was 48 hours)

**Files Changed**:
- `backend/src/routes/moralisIngest.js`
- `frontend/src/components/InvestigatorTrace.js`

---

### 3. **Graph Data Not Persisting** ✅

**Problem**: In-memory graph data was lost between script runs.

**Fix**:
- Created `sharedMemoryGraph.js` singleton
- Backend auto-seeds on startup
- Graph persists for entire backend session

**Files Changed**:
- `backend/src/graph/sharedMemoryGraph.js`
- `backend/src/index.js` (auto-seed on startup)

---

### 4. **Moralis API Integration** ✅

**Problem**: System wasn't using real blockchain data.

**Fix**:
- Integrated Moralis API client
- Added endpoints to fetch and ingest
- Frontend automatically fetches from Moralis when tracing

**Files Created**:
- `backend/src/services/moralisClient.js`
- `backend/src/routes/moralisIngest.js`

---

## 📊 Current System Status

### ✅ Working Components

1. **Frontend UI** - React app with graph visualization
2. **Backend API** - Express server with all endpoints
3. **Moralis Integration** - Fetches real blockchain data
4. **Graph Database** - Neo4j + in-memory fallback
5. **Tracer** - Path finding algorithm (shows all paths)
6. **Mock Services** - Bank and exchange simulators
7. **Evidence Service** - Bundle creation and signing
8. **Fabric Client** - Blockchain evidence storage (PoC)

### 🔧 Configuration

**Environment Variables** (`.env`):
```env
# Backend
PORT=4000
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_password
USE_MEMORY_GRAPH=true  # Use in-memory instead of Neo4j

# Moralis
MORALIS_API_KEY=your_api_key_here

# Fabric (PoC)
FABRIC_NETWORK_URL=http://localhost:7054
```

---

## 🚀 How to Use

### 1. **Start the System**

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

### 2. **Trace a Wallet Address**

1. Open http://localhost:3000
2. Click "Investigator Trace"
3. Enter wallet address: `0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb`
4. Select "7 days" for time window
5. Click "Trace"
6. See the graph visualization!

### 3. **Check Graph Stats**

```bash
curl http://localhost:4000/api/graph/debug/stats
```

### 4. **View Actor Details**

```bash
curl http://localhost:4000/api/graph/debug/actor/chain:0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
```

---

## 📈 What's Next (Production)

### To Make This Production-Ready:

1. **Replace Mocks**:
   - Integrate real bank APIs (with MTLS)
   - Integrate real exchange APIs (with legal approvals)

2. **Security**:
   - Use AWS KMS/HSM instead of OpenSSL
   - Implement PII tokenization
   - Set up mutual TLS (MTLS)

3. **Infrastructure**:
   - Deploy Neo4j cluster
   - Set up Kafka for streaming
   - Deploy Hyperledger Fabric network

4. **Scalability**:
   - Add Redis caching
   - Implement rate limiting
   - Add monitoring and alerting

---

## 📚 Key Files Reference

| Component | File Path |
|-----------|-----------|
| Frontend App | `frontend/src/App.js` |
| Graph Visualization | `frontend/src/components/InvestigatorTrace.js` |
| Backend Server | `backend/src/index.js` |
| Moralis Client | `backend/src/services/moralisClient.js` |
| Graph Client | `backend/src/graph/memoryGraphClient.js` |
| Tracer | `backend/src/tracer/memoryTracer.js` |
| Evidence Service | `backend/src/services/evidenceService.js` |
| Mock Bank | `tools/mock_bank/server.js` |
| Mock Exchange | `tools/mock_exchange/server.js` |

---

## 🎯 Summary

**We built a complete fraud detection system that:**

1. ✅ Fetches **real blockchain data** from Moralis
2. ✅ Stores transfers in a **graph database** (Neo4j or in-memory)
3. ✅ **Traces paths** from any wallet address
4. ✅ **Visualizes** the fraud trail in an interactive graph
5. ✅ **Stitches identities** across banks, blockchain, and exchanges
6. ✅ **Creates evidence bundles** with digital signatures
7. ✅ **Stores evidence** on Hyperledger Fabric (immutable)
8. ✅ Provides a **beautiful UI** for investigators

**The system is working and ready to use!** 🎉

