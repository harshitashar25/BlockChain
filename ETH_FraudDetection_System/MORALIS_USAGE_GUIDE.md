# Moralis API Usage Guide

## 🎯 Where Moralis API is Used

### 1. **Moralis Client Service** (`backend/src/services/moralisClient.js`)
- Fetches ERC20 token transfers
- Fetches native token transfers (ETH, BNB, etc.)
- Converts Moralis format to canonical TransferEvent format
- Falls back to synthetic data if API key not provided

### 2. **Moralis API Routes** (`backend/src/routes/moralis.js`)
- `GET /api/moralis/address/:address/transfers` - Fetch ERC20 transfers
- `GET /api/moralis/address/:address/native` - Fetch native transfers
- `GET /api/moralis/health` - Check if API key is configured

### 3. **Moralis Ingest Routes** (`backend/src/routes/moralisIngest.js`) ⭐ NEW
- `POST /api/moralis/fetch-and-ingest` - Fetch from Moralis and ingest into graph
- `POST /api/moralis/trace-from-address` - Fetch, ingest, and trace in one call

### 4. **Demo Runner** (`demo/runner.js`)
- Step 3: Fetches on-chain transfers using Moralis
- Falls back to synthetic data if API key not available

## 🚀 How to Use Moralis API

### Step 1: Get Moralis API Key

1. Sign up at: https://moralis.io/
2. Get your API key from dashboard
3. Add to `.env`:
   ```bash
   MORALIS_API_KEY=your_api_key_here
   ```

### Step 2: Use in Investigator Trace

**Option A: Automatic (Recommended)**

Just enter a wallet address in the Investigator Trace UI:
```
0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
```

The system will:
1. ✅ Fetch transfers from Moralis API
2. ✅ Ingest into graph
3. ✅ Trace paths automatically

**Option B: Manual API Call**

```bash
# Fetch and ingest transfers
curl -X POST http://localhost:4000/api/moralis/fetch-and-ingest \
  -H "Content-Type: application/json" \
  -d '{
    "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "chain": "eth",
    "limit": 100
  }'

# Then trace
curl "http://localhost:4000/api/tracer/trace?seed=chain:0x742d35cc6634c0532925a3b844bc9e7595f0beb&depth=6&hours=48"
```

**Option C: Fetch and Trace in One Call**

```bash
curl -X POST http://localhost:4000/api/moralis/trace-from-address \
  -H "Content-Type: application/json" \
  -d '{
    "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "chain": "eth",
    "depth": 6,
    "hours": 48,
    "minAmt": 0.1
  }'
```

## 📊 What Data Moralis Provides

### ERC20 Transfers
- Token transfers (USDT, USDC, etc.)
- Token addresses
- Amounts (in wei and human-readable)
- Transaction hashes
- Block numbers and timestamps
- From/to addresses

### Native Transfers
- ETH, BNB, MATIC transfers
- Transaction details
- Gas information

## 🔄 Complete Workflow with Moralis

1. **Bank reports fraud** → UTR provided
2. **Query exchange LEA** → Get withdrawal wallet address
3. **Fetch from Moralis** → Get all transfers for that wallet
4. **Ingest into graph** → Store transfers as relationships
5. **Trace paths** → Find routes to exchange endpoints
6. **Visualize** → See complete money flow

## 🧪 Testing Without Moralis Key

If you don't have a Moralis API key:
- System uses **synthetic data** automatically
- Still works for PoC/demos
- Use the seed script: `node demo/seed_test_data.js`

## 💡 Example: Real Wallet Tracing

```bash
# 1. Fetch real data from Moralis for a wallet
curl -X POST http://localhost:4000/api/moralis/fetch-and-ingest \
  -H "Content-Type: application/json" \
  -d '{
    "address": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",  # Vitalik's wallet
    "chain": "eth",
    "limit": 50
  }'

# 2. Trace from that wallet
curl "http://localhost:4000/api/tracer/trace?seed=chain:0xd8da6bf26964af9d7eed9e03e53415d37aa96045&depth=4&hours=168&minAmt=1"
```

## 🔐 API Key Setup

1. **Get key**: https://moralis.io/api-keys
2. **Add to .env**:
   ```bash
   MORALIS_API_KEY=your_key_here
   ```
3. **Restart backend**
4. **Verify**:
   ```bash
   curl http://localhost:4000/api/moralis/health
   ```
   Should show: `"hasApiKey": true`

## 📈 Rate Limits

Moralis free tier:
- 40 requests/second
- 100,000 requests/month

For production, consider:
- Caching results
- Pagination
- Rate limiting

## 🎯 Summary

**Moralis API is used to:**
1. ✅ Fetch real blockchain transfer data
2. ✅ Enrich fraud trails with on-chain activity
3. ✅ Build complete money flow graphs
4. ✅ Trace from real wallet addresses

**The Investigator Trace UI now:**
- Automatically fetches from Moralis when you enter a wallet address
- Ingests data into the graph
- Traces paths in one step

**No more empty graphs!** 🎉

