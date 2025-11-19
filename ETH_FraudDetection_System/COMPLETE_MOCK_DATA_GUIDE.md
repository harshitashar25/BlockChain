# 🎯 Complete Mock Data Guide - Freeze to Final Destination

## 📋 Overview

This guide shows you how to use the **complete mock dataset** that creates a full fraud trail from UTR to final destination exchange, allowing you to test the complete freeze flow.

---

## 🗂️ **Dataset Structure**

The complete mock dataset (`demo/complete_mock_dataset.json`) includes:

### **1. UTRs (Bank Transactions)**
- `UTR-FREEZE-001` - 5,00,000 INR fraud
- `UTR-FREEZE-002` - 7,50,000 INR fraud

### **2. P2P Exchange Orders**
- `P2P-FREEZE-001` - Links UTR-FREEZE-001 to wallet `0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb`
- `P2P-FREEZE-002` - Links UTR-FREEZE-002 to wallet `0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb`

### **3. Blockchain Transfers (Complete Trail)**
Creates a complete path:
```
0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb (withdrawal wallet)
  ↓ 2.5 ETH
0xd4fe23d3f98AD0bdAC21Cd2d93100EE6055A49 (intermediate wallet 1)
  ↓ 2.0 ETH
0xfeaaed0e3f98AD0bdAC21Cd2d93100EE6055A49 (intermediate wallet 2)
  ↓ 1.5 ETH
0x8888888888888888888888888888888888888888 (intermediate wallet 3)
  ↓ 1.0 ETH
0x9999999999999999999999999999999999999999 (intermediate wallet 4)
  ↓ 0.8 ETH
exchange:binance_deposit_wallet (FINAL DESTINATION) ✅
```

### **4. Final Destinations**
- `exchange:binance_deposit_wallet` - Final destination for UTR-FREEZE-001
- `exchange:coinbase_deposit_wallet` - Final destination for UTR-FREEZE-002

---

## 🚀 **How to Use**

### **Step 1: Load the Complete Mock Data**

```bash
# Option A: Use the loader script
cd scripts
node load_complete_mock_data.js

# Option B: Restart mock services (they auto-load the dataset)
# The mock bank and exchange servers will automatically load complete_mock_dataset.json
```

### **Step 2: Submit Case with UTR**

**Via UI:**
1. Go to "Bank Report"
2. Fill form:
   - Case ID: `CASE-FREEZE-TEST-001`
   - UTR: `UTR-FREEZE-001`
   - Amount: `500000`
3. Click "Submit Fraud Report"
4. System automatically traces and gets assets

**Via API:**
```bash
curl -X POST http://localhost:4000/api/fabric/submit-evidence \
  -H "Content-Type: application/json" \
  -d '{
    "caseId": "CASE-FREEZE-TEST-001",
    "evidenceHash": "sha256:test001",
    "requester": "bank:HDFC"
  }'
```

### **Step 3: Run Automated Trace**

**Via UI:**
1. Go to "LEA Dashboard"
2. Find case `CASE-FREEZE-TEST-001`
3. Click "Run Trace" button
4. Enter UTR: `UTR-FREEZE-001`
5. Wait 10-30 seconds
6. Assets will appear!

**Via API:**
```bash
curl -X POST http://localhost:4000/api/automated-trace/utr-with-assets \
  -H "Content-Type: application/json" \
  -d '{
    "utr": "UTR-FREEZE-001",
    "chain": "eth",
    "depth": 6,
    "hours": 168
  }'
```

**Expected Asset References:**
```json
{
  "asset_refs": [
    "bank:mule_hash_001_xyz789",
    "exchange:P2P-FREEZE-001",
    "chain:0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "chain:0xd4fe23d3f98AD0bdAC21Cd2d93100EE6055A49",
    "chain:0xfeaaed0e3f98AD0bdAC21Cd2d93100EE6055A49",
    "chain:0x8888888888888888888888888888888888888888",
    "chain:0x9999999999999999999999999999999999999999",
    "exchange:binance_deposit_wallet"
  ]
}
```

### **Step 4: Request Freeze**

**Via UI:**
1. In LEA Dashboard, click "Request Freeze"
2. Modal shows all 8 asset references
3. Click "Request Freeze" to confirm

**Via API:**
```bash
curl -X POST http://localhost:4000/api/freeze/request \
  -H "Content-Type: application/json" \
  -d '{
    "caseId": "CASE-FREEZE-TEST-001",
    "evidenceHash": "sha256:test001",
    "requestedBy": "LEA:IndiaCyber",
    "severity": "high",
    "assetRefs": [
      "bank:mule_hash_001_xyz789",
      "exchange:P2P-FREEZE-001",
      "chain:0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
      "chain:0xd4fe23d3f98AD0bdAC21Cd2d93100EE6055A49",
      "chain:0xfeaaed0e3f98AD0bdAC21Cd2d93100EE6055A49",
      "chain:0x8888888888888888888888888888888888888888",
      "chain:0x9999999999999999999999999999999999999999",
      "exchange:binance_deposit_wallet"
    ]
  }'
```

### **Step 5: Approve Freeze (3 Times)**

```bash
# Approval 1: Bank A
curl -X POST http://localhost:4000/api/freeze/approve \
  -H "Content-Type: application/json" \
  -d '{"caseId": "CASE-FREEZE-TEST-001", "approver": "bank:HDFC"}'

# Approval 2: Bank B
curl -X POST http://localhost:4000/api/freeze/approve \
  -H "Content-Type: application/json" \
  -d '{"caseId": "CASE-FREEZE-TEST-001", "approver": "bank:ICICI"}'

# Approval 3: LEA
curl -X POST http://localhost:4000/api/freeze/approve \
  -H "Content-Type: application/json" \
  -d '{"caseId": "CASE-FREEZE-TEST-001", "approver": "LEA:IndiaCyber"}'
```

### **Step 6: Freeze Activates! 🎉**

After 3rd approval:
- ✅ All bank accounts frozen
- ✅ Exchange accounts frozen
- ✅ All intermediate wallets frozen
- ✅ **Final destination exchange frozen!** 🎯

---

## 📊 **Complete Fraud Trail**

### **For UTR-FREEZE-001:**

```
Victim Account (VICTIM-ACCOUNT-001)
  ↓ 5,00,000 INR
Mule Account (mule_hash_001_xyz789)
  ↓ P2P Order (P2P-FREEZE-001)
Withdrawal Wallet (0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb)
  ↓ 2.5 ETH
Intermediate Wallet 1 (0xd4fe23d3f98AD0bdAC21Cd2d93100EE6055A49)
  ↓ 2.0 ETH
Intermediate Wallet 2 (0xfeaaed0e3f98AD0bdAC21Cd2d93100EE6055A49)
  ↓ 1.5 ETH
Intermediate Wallet 3 (0x8888888888888888888888888888888888888888)
  ↓ 1.0 ETH
Intermediate Wallet 4 (0x9999999999999999999999999999999999999999)
  ↓ 0.8 ETH
FINAL DESTINATION: Binance Exchange (exchange:binance_deposit_wallet) ✅
```

**All 8 assets will be frozen when you approve the freeze!**

---

## 🧪 **Test Cases Included**

### **Test Case 1: CASE-FREEZE-TEST-001**
- **UTR:** `UTR-FREEZE-001`
- **Path Length:** 6 hops
- **Final Destination:** `exchange:binance_deposit_wallet`
- **Expected Assets:** 8 assets

### **Test Case 2: CASE-FREEZE-TEST-002**
- **UTR:** `UTR-FREEZE-002`
- **Path Length:** 4 hops
- **Final Destination:** `exchange:coinbase_deposit_wallet`
- **Expected Assets:** 6 assets

---

## 🔍 **Verify the Trail**

### **Check Graph Visualization:**

1. Go to "Investigator Trace"
2. Enter wallet: `0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb`
3. Click "Trace"
4. You'll see the complete path to final destination!

### **Check Asset References:**

```bash
curl http://localhost:4000/api/freeze/status/CASE-FREEZE-TEST-001
```

Should show all 8 asset references.

---

## ✅ **What Gets Frozen**

When freeze activates, these will be frozen:

1. ✅ **Bank Account:** `mule_hash_001_xyz789`
2. ✅ **Exchange Order:** `P2P-FREEZE-001`
3. ✅ **Withdrawal Wallet:** `0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb`
4. ✅ **Intermediate Wallet 1:** `0xd4fe23d3f98AD0bdAC21Cd2d93100EE6055A49`
5. ✅ **Intermediate Wallet 2:** `0xfeaaed0e3f98AD0bdAC21Cd2d93100EE6055A49`
6. ✅ **Intermediate Wallet 3:** `0x8888888888888888888888888888888888888888`
7. ✅ **Intermediate Wallet 4:** `0x9999999999999999999999999999999999999999`
8. ✅ **Final Destination:** `exchange:binance_deposit_wallet` 🎯

---

## 🎯 **Quick Start**

```bash
# 1. Load complete mock data
node scripts/load_complete_mock_data.js

# 2. Submit case
curl -X POST http://localhost:4000/api/fabric/submit-evidence \
  -H "Content-Type: application/json" \
  -d '{"caseId": "CASE-FREEZE-TEST-001", "evidenceHash": "sha256:test", "requester": "bank:HDFC"}'

# 3. Run trace
curl -X POST http://localhost:4000/api/automated-trace/utr-with-assets \
  -H "Content-Type: application/json" \
  -d '{"utr": "UTR-FREEZE-001"}'

# 4. Request freeze (use asset_refs from step 3)
curl -X POST http://localhost:4000/api/freeze/request \
  -H "Content-Type: application/json" \
  -d '{
    "caseId": "CASE-FREEZE-TEST-001",
    "evidenceHash": "sha256:test",
    "requestedBy": "LEA:IndiaCyber",
    "severity": "high",
    "assetRefs": ["bank:mule_hash_001_xyz789", "exchange:P2P-FREEZE-001", "chain:0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb", "chain:0xd4fe23d3f98AD0bdAC21Cd2d93100EE6055A49", "chain:0xfeaaed0e3f98AD0bdAC21Cd2d93100EE6055A49", "chain:0x8888888888888888888888888888888888888888", "chain:0x9999999999999999999999999999999999999999", "exchange:binance_deposit_wallet"]
  }'

# 5. Approve 3 times
curl -X POST http://localhost:4000/api/freeze/approve -d '{"caseId": "CASE-FREEZE-TEST-001", "approver": "bank:HDFC"}'
curl -X POST http://localhost:4000/api/freeze/approve -d '{"caseId": "CASE-FREEZE-TEST-001", "approver": "bank:ICICI"}'
curl -X POST http://localhost:4000/api/freeze/approve -d '{"caseId": "CASE-FREEZE-TEST-001", "approver": "LEA:IndiaCyber"}'

# 6. Check status
curl http://localhost:4000/api/freeze/status/CASE-FREEZE-TEST-001
```

---

## 📋 **Summary**

✅ **Complete trail:** UTR → Bank → Exchange → Wallet → Intermediate Wallets → Final Exchange  
✅ **All assets linked:** Every step is connected  
✅ **Final destination:** Exchange wallets where funds are cashed out  
✅ **Freeze works:** All 8 assets freeze when approved  

**This dataset gives you a complete end-to-end test of the freeze system!** 🎉

