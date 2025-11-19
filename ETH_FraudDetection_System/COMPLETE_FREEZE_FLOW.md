# 🔄 Complete Freeze Flow - Step-by-Step Guide

## ❌ Problem: "No assets to freeze"

You're seeing this because the case was created **without asset references**. The system needs to trace the fraud trail first to identify which assets to freeze.

---

## ✅ **CORRECT FLOW: How to Freeze Assets**

### **Step 1: Bank Reports Fraud with UTR**

**Action:** Bank submits a fraud case with UTR number

```bash
# Option A: Via UI (Bank Report page)
# Go to "Bank Report" → Fill form → Submit

# Option B: Via API
curl -X POST http://localhost:4000/api/fabric/submit-evidence \
  -H "Content-Type: application/json" \
  -d '{
    "caseId": "CASE-2025-001",
    "evidenceHash": "sha256:abc123def456",
    "requester": "bank:HDFC"
  }'
```

**What happens:**
- Case is created with status: `SUBMITTED`
- Case has NO asset references yet (this is normal!)

---

### **Step 2: Automated Tracing (MOST IMPORTANT!)**

**Action:** Run automated trace from UTR to get asset references

```bash
# Use the automated tracing endpoint
curl -X POST http://localhost:4000/api/automated-trace/utr-with-assets \
  -H "Content-Type: application/json" \
  -d '{
    "utr": "UTR123456789",
    "chain": "eth",
    "depth": 6,
    "hours": 168
  }'
```

**What this does:**
1. ✅ Queries bank for UTR details → Gets mule account
2. ✅ Queries exchange for P2P order → Gets withdrawal wallet
3. ✅ Fetches blockchain transfers from Moralis
4. ✅ Ingests into graph database
5. ✅ Traces paths to find all connected addresses
6. ✅ **Extracts asset references:**
   - `bank:ACCOUNT_HASH` (mule account)
   - `exchange:ORDER_ID` (P2P order)
   - `chain:0xABC...` (wallet addresses)

**Response:**
```json
{
  "ok": true,
  "asset_refs": [
    "bank:abc123def456",
    "exchange:P2P-ORDER-001",
    "chain:0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "chain:0xDEF456...",
    "chain:0xGHI789..."
  ],
  "result": { ... }
}
```

---

### **Step 3: Update Case with Asset References**

**Action:** Update the case with extracted asset references

```bash
# Request freeze with asset references
curl -X POST http://localhost:4000/api/freeze/request \
  -H "Content-Type: application/json" \
  -d '{
    "caseId": "CASE-2025-001",
    "evidenceHash": "sha256:abc123def456",
    "requestedBy": "LEA:IndiaCyber",
    "severity": "high",
    "assetRefs": [
      "bank:abc123def456",
      "exchange:P2P-ORDER-001",
      "chain:0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
    ]
  }'
```

**What happens:**
- Case status changes to: `PENDING_APPROVAL`
- Asset references are stored in the case
- Case is ready for multi-party approval

---

### **Step 4: Multi-Party Approval**

**Action:** Three parties approve the freeze

```bash
# Approval 1: Bank A
curl -X POST http://localhost:4000/api/freeze/approve \
  -H "Content-Type: application/json" \
  -d '{
    "caseId": "CASE-2025-001",
    "approver": "bank:HDFC"
  }'

# Approval 2: Bank B
curl -X POST http://localhost:4000/api/freeze/approve \
  -H "Content-Type: application/json" \
  -d '{
    "caseId": "CASE-2025-001",
    "approver": "bank:ICICI"
  }'

# Approval 3: LEA (via UI or API)
curl -X POST http://localhost:4000/api/freeze/approve \
  -H "Content-Type: application/json" \
  -d '{
    "caseId": "CASE-2025-001",
    "approver": "LEA:IndiaCyber"
  }'
```

**What happens:**
- After 3rd approval → Freeze activates automatically
- `FreezeActivated` event is emitted
- Freeze propagation begins

---

### **Step 5: Automatic Freeze Propagation**

**Action:** System automatically freezes all assets

**What happens automatically:**
1. ✅ All connected banks receive hold requests
2. ✅ Exchange accounts are frozen
3. ✅ All connected wallet addresses are frozen (graph-based, depth 3)

**You can check status:**
```bash
curl http://localhost:4000/api/freeze/status/CASE-2025-001
```

---

## 🎯 **COMPLETE EXAMPLE WITH REAL DATA**

### **Using Synthetic Dataset**

The system includes a synthetic dataset with real-looking data. Here's how to use it:

**1. Check available UTRs:**
```bash
# View synthetic dataset
cat demo/synthetic_dataset.json | grep -A 5 "utr"
```

**2. Use a real UTR from dataset:**
```bash
# Example UTR from dataset: "UTR123456789"

# Step 1: Submit case
curl -X POST http://localhost:4000/api/fabric/submit-evidence \
  -H "Content-Type: application/json" \
  -d '{
    "caseId": "CASE-2025-001",
    "evidenceHash": "sha256:test123",
    "requester": "bank:HDFC"
  }'

# Step 2: Run automated trace (THIS IS THE KEY STEP!)
curl -X POST http://localhost:4000/api/automated-trace/utr-with-assets \
  -H "Content-Type: application/json" \
  -d '{
    "utr": "UTR123456789"
  }'

# Step 3: Request freeze with asset refs from step 2
curl -X POST http://localhost:4000/api/freeze/request \
  -H "Content-Type: application/json" \
  -d '{
    "caseId": "CASE-2025-001",
    "evidenceHash": "sha256:test123",
    "requestedBy": "LEA:IndiaCyber",
    "severity": "high",
    "assetRefs": [
      "bank:abc123def456",
      "exchange:P2P-ORDER-001",
      "chain:0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
    ]
  }'
```

---

## 🔧 **FIXING YOUR CURRENT CASE**

### **Option 1: Add Asset References Manually**

If you already have a case without assets, you can add them:

```bash
# First, run automated trace to get asset refs
curl -X POST http://localhost:4000/api/automated-trace/utr-with-assets \
  -H "Content-Type: application/json" \
  -d '{
    "utr": "UTR123456789"
  }'

# Copy the asset_refs from response, then:
curl -X POST http://localhost:4000/api/freeze/request \
  -H "Content-Type: application/json" \
  -d '{
    "caseId": "CASE-TEST-001",
    "evidenceHash": "hash-1763579362825",
    "requestedBy": "LEA:IndiaCyber",
    "severity": "high",
    "assetRefs": [
      "bank:ACCOUNT_HASH_HERE",
      "exchange:ORDER_ID_HERE",
      "chain:0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
    ]
  }'
```

### **Option 2: Create New Case with Proper Flow**

1. **Delete current case** (or create new one)
2. **Follow complete flow above**

---

## 📋 **QUICK REFERENCE: Complete Flow**

```
1. Bank submits case (with UTR)
   ↓
2. Run automated trace (UTR → assets)
   ↓
3. Request freeze (with asset refs)
   ↓
4. Multi-party approval (3 approvals)
   ↓
5. Freeze activates automatically
   ↓
6. Assets frozen across all institutions
```

---

## 🚨 **Common Mistakes**

❌ **Mistake 1:** Submitting case without UTR
- **Fix:** Always include UTR when submitting case

❌ **Mistake 2:** Requesting freeze before tracing
- **Fix:** Run automated trace FIRST to get asset references

❌ **Mistake 3:** Not providing asset references
- **Fix:** Use `/api/automated-trace/utr-with-assets` to get them

---

## ✅ **TESTING WITH REAL DATA**

### **Test Script:**

```bash
#!/bin/bash

# Step 1: Submit case
echo "📋 Step 1: Submitting case..."
curl -X POST http://localhost:4000/api/fabric/submit-evidence \
  -H "Content-Type: application/json" \
  -d '{
    "caseId": "CASE-TEST-001",
    "evidenceHash": "sha256:test123",
    "requester": "bank:HDFC"
  }'

echo -e "\n"

# Step 2: Run automated trace
echo "🔍 Step 2: Running automated trace..."
TRACE_RESULT=$(curl -s -X POST http://localhost:4000/api/automated-trace/utr-with-assets \
  -H "Content-Type: application/json" \
  -d '{
    "utr": "UTR123456789"
  }')

echo "$TRACE_RESULT" | jq '.asset_refs'

# Extract asset refs (you'll need to copy these manually)
echo -e "\n📋 Copy the asset_refs above and use in Step 3"

# Step 3: Request freeze (replace ASSET_REFS with actual values)
echo -e "\n🔒 Step 3: Requesting freeze..."
curl -X POST http://localhost:4000/api/freeze/request \
  -H "Content-Type: application/json" \
  -d '{
    "caseId": "CASE-TEST-001",
    "evidenceHash": "sha256:test123",
    "requestedBy": "LEA:IndiaCyber",
    "severity": "high",
    "assetRefs": ["bank:abc123", "exchange:ORDER001", "chain:0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"]
  }'

echo -e "\n✅ Done! Now approve 3 times to activate freeze."
```

---

## 🎯 **Summary**

**The key issue:** You're trying to freeze a case that has no asset references.

**The solution:** 
1. Run automated trace FIRST to get asset references
2. Then request freeze WITH those asset references
3. Then approve 3 times

**The flow:** UTR → Trace → Assets → Freeze → Approve → Activate

See the test script above for a complete working example!

