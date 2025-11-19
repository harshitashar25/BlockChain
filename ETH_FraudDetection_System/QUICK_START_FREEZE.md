# 🚀 Quick Start: How to Freeze Assets

## ❌ Problem: "No assets to freeze"

This happens when a case is created **without running the trace first**. The system needs to trace the fraud trail to identify which assets to freeze.

---

## ✅ **SOLUTION: Two Easy Options**

### **OPTION 1: Automatic Flow (Recommended) 🎯**

**This is the easiest way - the system does everything automatically!**

1. **Go to "Bank Report" page**
   - Click "Bank Report" in the sidebar

2. **Fill the form:**
   ```
   Case ID: CASE-2025-001
   UTR: UTR123456789
   Amount: 100000
   ```

3. **Click "Submit Fraud Report"**
   - ✅ Case is submitted
   - ✅ System automatically runs trace from UTR
   - ✅ Gets asset references (bank accounts, exchange orders, wallets)
   - ✅ Updates case with assets
   - ✅ Shows success message

4. **Go to "LEA Dashboard"**
   - Click "LEA Dashboard" in the sidebar
   - Find your case (CASE-2025-001)
   - You'll see it now has asset references! ✅

5. **Request Freeze:**
   - Click "Request Freeze" button
   - Modal shows all asset references
   - Click "Request Freeze" to confirm

6. **Approve Freeze (3 times):**
   - Click "Approve" button 3 times
   - Or use API:
     ```bash
     # Approval 1
     curl -X POST http://localhost:4000/api/freeze/approve \
       -d '{"caseId": "CASE-2025-001", "approver": "bank:HDFC"}'
     
     # Approval 2
     curl -X POST http://localhost:4000/api/freeze/approve \
       -d '{"caseId": "CASE-2025-001", "approver": "bank:ICICI"}'
     
     # Approval 3
     curl -X POST http://localhost:4000/api/freeze/approve \
       -d '{"caseId": "CASE-2025-001", "approver": "LEA:IndiaCyber"}'
     ```

7. **Freeze Activates! 🎉**
   - After 3rd approval, freeze activates automatically
   - All assets are frozen across banks, exchanges, and wallets

---

### **OPTION 2: Manual Flow (If assets are missing)**

**If you already have a case without assets, use this:**

1. **Go to "LEA Dashboard"**
   - Find the case without assets (shows "No assets specified")

2. **Click "Run Trace" button**
   - A modal appears asking for UTR

3. **Enter UTR:**
   ```
   UTR: UTR123456789
   ```
   - Click OK

4. **System runs trace:**
   - ✅ Queries bank for UTR details
   - ✅ Queries exchange for P2P order
   - ✅ Fetches blockchain transfers
   - ✅ Gets asset references
   - ✅ Updates case with assets

5. **Now request freeze:**
   - Click "Request Freeze"
   - Assets are now available!

---

## 📋 **Test Data**

Use these UTRs from the synthetic dataset:

- `UTR123456789` - Has P2P order linked
- `UTR987654321` - Has P2P order linked
- `UTR555666777` - Has P2P order linked

---

## 🔍 **What Asset References Look Like**

After tracing, you'll see asset references like:

```
bank:abc123def456          (Bank account hash)
exchange:P2P-ORDER-001     (Exchange order ID)
chain:0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb  (Wallet address)
chain:0xDEF456...          (Connected wallet)
chain:0xGHI789...          (Connected wallet)
```

These are the assets that will be frozen when you approve the freeze.

---

## ✅ **Complete Flow Summary**

```
1. Submit Case (with UTR)
   ↓
2. Auto-Trace Runs (gets asset references)
   ↓
3. Request Freeze (with asset refs)
   ↓
4. Approve 3 Times (Bank A, Bank B, LEA)
   ↓
5. Freeze Activates Automatically
   ↓
6. All Assets Frozen! 🎉
```

---

## 🚨 **Troubleshooting**

### **Still seeing "No assets to freeze"?**

1. **Check if UTR is valid:**
   ```bash
   curl http://localhost:4001/api/bank/utr/UTR123456789
   ```

2. **Check if trace ran:**
   - Look for success message after submitting case
   - Check browser console for errors

3. **Manually run trace:**
   - Use "Run Trace" button in LEA Dashboard
   - Or use API:
     ```bash
     curl -X POST http://localhost:4000/api/automated-trace/utr-with-assets \
       -H "Content-Type: application/json" \
       -d '{"utr": "UTR123456789"}'
     ```

4. **Check case status:**
   ```bash
   curl http://localhost:4000/api/freeze/status/CASE-2025-001
   ```

---

## 🎯 **Quick Test**

Run this complete test:

```bash
# 1. Submit case
curl -X POST http://localhost:4000/api/fabric/submit-evidence \
  -H "Content-Type: application/json" \
  -d '{
    "caseId": "CASE-TEST-001",
    "evidenceHash": "sha256:test123",
    "requester": "bank:HDFC"
  }'

# 2. Run trace
curl -X POST http://localhost:4000/api/automated-trace/utr-with-assets \
  -H "Content-Type: application/json" \
  -d '{"utr": "UTR123456789"}'

# 3. Request freeze (use asset_refs from step 2)
curl -X POST http://localhost:4000/api/freeze/request \
  -H "Content-Type: application/json" \
  -d '{
    "caseId": "CASE-TEST-001",
    "evidenceHash": "sha256:test123",
    "requestedBy": "LEA:IndiaCyber",
    "severity": "high",
    "assetRefs": ["bank:abc123", "exchange:ORDER001", "chain:0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"]
  }'

# 4. Approve 3 times
curl -X POST http://localhost:4000/api/freeze/approve \
  -H "Content-Type: application/json" \
  -d '{"caseId": "CASE-TEST-001", "approver": "bank:HDFC"}'

curl -X POST http://localhost:4000/api/freeze/approve \
  -H "Content-Type: application/json" \
  -d '{"caseId": "CASE-TEST-001", "approver": "bank:ICICI"}'

curl -X POST http://localhost:4000/api/freeze/approve \
  -H "Content-Type: application/json" \
  -d '{"caseId": "CASE-TEST-001", "approver": "LEA:IndiaCyber"}'
```

---

## 📚 **More Details**

See `COMPLETE_FREEZE_FLOW.md` for the complete technical documentation.

---

**That's it! The system now automatically handles everything. Just submit a case with UTR and the rest happens automatically!** 🎉

