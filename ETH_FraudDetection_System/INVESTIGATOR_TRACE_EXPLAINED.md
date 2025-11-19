# Investigator Trace - What It Does

## 🎯 Purpose

The **Investigator Trace** feature finds **money flow paths** from a suspicious wallet/account to exchange endpoints where fraudsters cash out cryptocurrency.

## 🔍 How It Works

### Step 1: Start from a Seed Actor
You provide a starting point (seed actor), such as:
- A wallet address: `chain:0x742d35cc6634c0532925a3b844bc9e7595f0beb`
- A bank account: `bank:account_hash_123`
- An exchange order: `exchange:P2P-ORDER-001`

### Step 2: Graph Traversal (Priority-BFS Algorithm)

The tracer uses a **Priority-Breadth-First-Search** algorithm:

1. **Starts at the seed actor**
2. **Explores outgoing relationships** (SENT, BRIDGED, IDENTITY)
3. **Prioritizes paths** by:
   - **Risk score** × **Amount** (higher risk + larger amounts = higher priority)
4. **Stops when reaching exchange endpoints** (where fraudsters cash out)
5. **Tracks depth** (max 6 hops by default)
6. **Filters by time window** (last 48 hours by default)
7. **Filters by minimum amount** (ignores small transfers < threshold)

### Step 3: Returns Paths

The tracer returns:
- **Paths**: Complete routes from seed to exchange endpoints
- **Nodes**: All actors (wallets, banks, exchanges) in the paths
- **Edges**: All relationships (transfers, bridges) connecting them
- **Exchange Endpoints**: Where the money ultimately went

## 📊 Example Flow

```
Seed: chain:0x742d35... (Suspicious wallet)
  ↓ SENT 0.3 ETH
chain:0x8ba1f1... (Intermediate wallet)
  ↓ SENT 0.1 ETH  
chain:0x123456... (Another wallet)
  ↓ SENT 2.4 ETH
chain:0xExchangeHotWallet... (Exchange hot wallet)
  ↓ SENT 2.4 ETH
exchange:P2P-ORDER-003 (Exchange endpoint) ✅ FOUND!
```

## 🎨 What You See in the UI

1. **Force Graph Visualization**:
   - **Nodes** (circles): Actors (wallets, banks, exchanges)
   - **Edges** (lines): Transfers/relationships
   - **Colors**:
     - 🔴 Red = Exchange endpoints (where money cashed out)
     - 🔵 Blue = Bank accounts
     - 🟢 Green = Chain wallets

2. **Path Information**:
   - Number of paths found
   - Confidence scores
   - Total nodes and edges explored

## 🔧 Configuration Options

- **Seed**: Starting actor ID (required)
- **Depth**: Maximum hops to explore (default: 6)
- **Hours**: Time window to search (default: 48 hours)
- **Min Amount**: Minimum transfer amount to consider (default: 100)

## 💡 Real-World Use Case

**Scenario**: A bank reports fraud - ₹100,000 transferred to a suspicious account.

1. **Investigator enters**: Bank account hash or UTR
2. **System traces**:
   - Bank account → P2P exchange order → Withdrawal wallet
   - Wallet → Multiple transfers → Bridge → Another chain
   - Final destination → Exchange hot wallet → Exchange endpoint
3. **Result**: Complete path showing where the money went
4. **Action**: LEA can now freeze assets at the exchange

## 🧮 Algorithm Details

### Priority Calculation
```
Priority = Risk_Score × Amount

Risk_Score factors:
- Exchange actors: 0.9 (high risk)
- Bridge hops: +0.2 (higher risk)
- Large amounts (>10k): +0.1
- Base score: 0.5
```

### Stopping Conditions
- ✅ Reached exchange endpoint → Stop expanding, record path
- ❌ Max depth reached → Stop
- ❌ No more relationships → Stop
- ❌ Amount below threshold → Skip

### Confidence Score
```
Confidence = 0.8 - (depth × 0.1)
- Deeper paths = lower confidence
- Minimum: 0.3
```

## 📈 What Makes It Powerful

1. **Multi-Chain**: Traces across Ethereum, BSC, Tron, etc.
2. **Bridge Detection**: Finds cross-chain money movement
3. **Identity Stitching**: Links bank accounts → exchanges → wallets
4. **Prioritized Search**: Focuses on high-risk, high-value paths
5. **Stop-on-Exchange**: Efficiently finds cash-out points

## 🎯 Output Example

```json
{
  "seed": "chain:0x742d35...",
  "paths": [
    {
      "path": [
        "chain:0x742d35...",
        "chain:0x8ba1f1...",
        "chain:0x123456...",
        "exchange:P2P-ORDER-003"
      ],
      "endpoint": "exchange:P2P-ORDER-003",
      "depth": 3,
      "confidence": 0.5
    }
  ],
  "total_paths": 1,
  "exchange_endpoints": ["exchange:P2P-ORDER-003"],
  "nodes": [...],
  "edges": [...]
}
```

## 🔐 Security & Privacy

- **Tokenized Data**: Bank accounts are hashed
- **PII Protection**: Real names/accounts stored separately
- **Audit Trail**: All traces logged for compliance

## 🚀 Next Steps After Trace

Once paths are found:
1. **Review paths** in the visualization
2. **Inspect nodes** for details
3. **Submit evidence** to Fabric chaincode
4. **Request freeze** at exchange endpoints
5. **Place bank holds** on linked accounts

---

**In Summary**: Investigator Trace is a **money flow tracker** that follows the digital trail from a suspicious starting point to where fraudsters cash out, helping investigators understand the complete fraud path and take action.

