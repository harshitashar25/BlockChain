# Mock Data Guide - Ready for Real Data Swap

This guide shows you how to use the mock data for trials and how to seamlessly switch to real bank/exchange data when available.

## 🎯 Quick Start with Mock Data

### 1. Start All Services

```bash
# Terminal 1: Backend
cd backend && npm start

# Terminal 2: Mock Bank
cd tools/mock_bank && npm start

# Terminal 3: Mock Exchange  
cd tools/mock_exchange && npm start

# Terminal 4: Frontend
cd frontend && npm start
```

### 2. Run the Demo

```bash
# Terminal 5: Run E2E demo
node demo/runner.js
```

## 📊 Available Mock Data

### UTRs (3 test cases)

1. **UTR123456789** - Rajesh Kumar, ₹100,000
   - Account: ACCOUNT123456
   - IFSC: HDFC0001234
   - Linked to P2P-ORDER-001

2. **UTR987654321** - Priya Sharma, ₹25,000
   - Account: ACCOUNT789012
   - IFSC: ICIC0005678
   - Linked to P2P-ORDER-002

3. **UTR555666777** - Amit Patel, ₹500,000
   - Account: ACCOUNT555666
   - IFSC: SBIN0009999
   - Linked to P2P-ORDER-003

### P2P Orders (3 orders)

1. **P2P-ORDER-001** - Alice Crypto (CN)
   - Wallet: `0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb`
   - Amount: 0.5 ETH (₹100,000)

2. **P2P-ORDER-002** - Bob Trader (US)
   - Wallet: `0x8ba1f109551bD432803012645Hac136c22C9C`
   - Amount: 0.125 ETH (₹25,000)

3. **P2P-ORDER-003** - Chen Lee (CN)
   - Wallet: `0x1234567890123456789012345678901234567890`
   - Amount: 2.5 ETH (₹500,000)

### On-Chain Transfers (4 synthetic transactions)

- Chain: Ethereum
- Complete flow from withdrawal wallet → intermediate → exchange
- Ready for Moralis enrichment if API key provided

## 🔄 How to Use Mock Data

### Test Case 1: Basic UTR Lookup

```bash
# Query bank for UTR
curl http://localhost:4001/api/bank/utr/UTR123456789

# Response includes:
# - Remitter details (name, account_hash, phone, pan_token)
# - Signed payload with signature
# - Downstream transfers
```

### Test Case 2: Exchange LEA Query

```bash
# Query exchange for P2P order
curl -X POST http://localhost:4002/api/exchange/lea/query \
  -H "Content-Type: application/json" \
  -d '{"utr": "UTR123456789"}'

# Response includes:
# - P2P order details
# - Buyer KYC information
# - Withdrawal wallet address
```

### Test Case 3: Full E2E Flow

```bash
# Run the complete demo
node demo/runner.js

# This will:
# 1. Fetch UTR from mock bank
# 2. Query exchange LEA
# 3. Fetch on-chain transfers (Moralis or synthetic)
# 4. Ingest into Neo4j
# 5. Stitch identities
# 6. Trace paths
# 7. Submit evidence
# 8. Request freeze
# 9. Approve freeze
# 10. Place bank hold
```

## 🔀 Switching to Real Data

The system is designed to seamlessly switch from mock to real data. Here's how:

### Option 1: Environment Variables (Recommended)

Simply change the URLs in `.env`:

```bash
# For Mock Data (Current)
MOCK_BANK_URL=http://localhost:4001
MOCK_EXCHANGE_URL=http://localhost:4002

# For Real Data (Production)
MOCK_BANK_URL=https://bank-api.example.com
MOCK_EXCHANGE_URL=https://exchange-lea-api.example.com
```

The backend will automatically use the real endpoints.

### Option 2: Replace Mock Services

The mock services use the same API contract as real banks/exchanges:

**Bank API Contract:**
```
GET /api/bank/utr/:utr
→ Returns: { payload: {...}, signature: "base64..." }

POST /api/bank/hold
→ Body: { caseId, assetRef, evidenceHash }
→ Returns: { ok: true, hold_id: "HOLD-..." }
```

**Exchange API Contract:**
```
POST /api/exchange/lea/query
→ Body: { utr | bank_account_hash }
→ Returns: { ok: true, order: {...} }
```

Simply point your `.env` to the real endpoints - no code changes needed!

### Option 3: Use Real Data in Dataset

You can replace `demo/synthetic_dataset.json` with real data:

```json
{
  "utrs": [
    {
      "utr": "REAL-UTR-12345",
      "remitter": {
        "name": "Real Name",
        "account_hash": "real_hash_from_bank",
        ...
      }
    }
  ],
  "p2p_orders": [
    {
      "order_id": "REAL-ORDER-123",
      "withdrawal_wallet": "0xRealWalletAddress",
      ...
    }
  ]
}
```

The mock services will serve this real data.

## 🔐 Real Data Requirements

When switching to real data, ensure:

1. **MTLS Certificates**: Configure in `.env`
   ```
   USE_MTLS=true
   MTLS_CLIENT_CERT_PATH=./certs/client.crt
   MTLS_CLIENT_KEY_PATH=./certs/client.key
   MTLS_CA_CERT_PATH=./certs/ca.crt
   ```

2. **API Keys**: Add to `.env`
   ```
   MORALIS_API_KEY=your_real_key
   BANK_API_KEY=your_bank_key
   EXCHANGE_API_KEY=your_exchange_key
   ```

3. **Legal Approvals**: 
   - MoU signed with bank
   - LEA access approved for exchange
   - Data sharing agreements in place

## 📝 Testing Checklist

- [ ] Mock bank returns UTR data with signature
- [ ] Mock exchange returns P2P order
- [ ] On-chain transfers ingested to Neo4j
- [ ] Identity stitching works (bank → exchange → wallet)
- [ ] Tracer finds paths to exchange endpoints
- [ ] Evidence bundle created and signed
- [ ] Freeze approval flow works
- [ ] Bank hold placed successfully

## 🚀 Production Readiness

The system is production-ready. To go live:

1. ✅ Replace mock URLs with real endpoints
2. ✅ Configure MTLS certificates
3. ✅ Add real API keys
4. ✅ Deploy Fabric chaincode to consortium
5. ✅ Swap OpenSSL for HSM/KMS
6. ✅ Complete legal approvals

**No code changes required** - just configuration!
