# ⚡ Quick Test: Freeze to Final Destination

## 🎯 **Test Case: UTR-FREEZE-001**

This test case creates a complete fraud trail from UTR to final destination exchange.

---

## 📋 **Complete Trail**

```
UTR-FREEZE-001 (5,00,000 INR)
  ↓
Mule Account (mule_hash_001_xyz789)
  ↓ P2P Order
Wallet: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
  ↓ 2.5 ETH
0xd4fe23d3f98AD0bdAC21Cd2d93100EE6055A49
  ↓ 2.0 ETH
0xfeaaed0e3f98AD0bdAC21Cd2d93100EE6055A49
  ↓ 1.5 ETH
0x8888888888888888888888888888888888888888
  ↓ 1.0 ETH
0x9999999999999999999999999999999999999999
  ↓ 0.8 ETH
🎯 FINAL: exchange:binance_deposit_wallet
```

**Total Assets to Freeze: 8**

---

## 🚀 **Quick Test Steps**

### **Step 1: Seed the Graph**

```bash
cd scripts
node seed_complete_mock_data.js
```

This loads all blockchain transfers into the graph.

### **Step 2: Restart Mock Services**

```bash
# Terminal 1: Mock Bank
cd tools/mock_bank
npm start

# Terminal 2: Mock Exchange
cd tools/mock_exchange
npm start
```

They will automatically load `complete_mock_dataset.json`.

### **Step 3: Submit Case (Via UI)**

1. Go to **"Bank Report"** page
2. Fill form:
   - **Case ID:** `CASE-FREEZE-TEST-001`
   - **UTR:** `UTR-FREEZE-001`
   - **Amount:** `500000`
3. Click **"Submit Fraud Report"**
4. ✅ System automatically traces and gets assets!

### **Step 4: Request Freeze**

1. Go to **"LEA Dashboard"**
2. Find case `CASE-FREEZE-TEST-001`
3. Click **"Request Freeze"**
4. You'll see **8 asset references**:
   - `bank:mule_hash_001_xyz789`
   - `exchange:P2P-FREEZE-001`
   - `chain:0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb`
   - `chain:0xd4fe23d3f98AD0bdAC21Cd2d93100EE6055A49`
   - `chain:0xfeaaed0e3f98AD0bdAC21Cd2d93100EE6055A49`
   - `chain:0x8888888888888888888888888888888888888888`
   - `chain:0x9999999999999999999999999999999999999999`
   - `exchange:binance_deposit_wallet` 🎯

### **Step 5: Approve Freeze (3 Times)**

Click **"Approve"** button 3 times, or use API:

```bash
# Approval 1
curl -X POST http://localhost:4000/api/freeze/approve \
  -H "Content-Type: application/json" \
  -d '{"caseId": "CASE-FREEZE-TEST-001", "approver": "bank:HDFC"}'

# Approval 2
curl -X POST http://localhost:4000/api/freeze/approve \
  -H "Content-Type: application/json" \
  -d '{"caseId": "CASE-FREEZE-TEST-001", "approver": "bank:ICICI"}'

# Approval 3
curl -X POST http://localhost:4000/api/freeze/approve \
  -H "Content-Type: application/json" \
  -d '{"caseId": "CASE-FREEZE-TEST-001", "approver": "LEA:IndiaCyber"}'
```

### **Step 6: Freeze Activates! 🎉**

After 3rd approval:
- ✅ All 8 assets frozen
- ✅ Bank account frozen
- ✅ Exchange order frozen
- ✅ All wallets frozen
- ✅ **Final destination exchange frozen!** 🎯

---

## 🔍 **Verify the Trail**

### **View Graph Visualization:**

1. Go to **"Investigator Trace"**
2. Enter: `0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb`
3. Click **"Trace"**
4. See complete path to final destination!

### **Check Freeze Status:**

```bash
curl http://localhost:4000/api/freeze/status/CASE-FREEZE-TEST-001
```

---

## 📊 **Expected Results**

### **After Trace:**
- ✅ 8 asset references found
- ✅ Complete trail from UTR to final exchange
- ✅ All intermediate wallets identified

### **After Freeze:**
- ✅ Status: `FREEZE_ACTIVE`
- ✅ All 8 assets frozen
- ✅ Final destination exchange frozen

---

## 🎯 **Test Case 2: UTR-FREEZE-002**

Same process, but:
- **UTR:** `UTR-FREEZE-002`
- **Final Destination:** `exchange:coinbase_deposit_wallet`
- **Assets:** 6 assets

---

## ✅ **Summary**

**This complete mock dataset gives you:**
- ✅ Complete fraud trail (UTR → Final Exchange)
- ✅ All connections properly linked
- ✅ Multiple intermediate wallets
- ✅ Final destination exchanges
- ✅ Ready to test complete freeze flow

**Just use UTR-FREEZE-001 and you'll get 8 assets to freeze, including the final destination!** 🎉

