# 🔧 Fix: Trace-and-Update 500 Error

## Root Cause

The **mock bank and exchange servers** need to be **restarted** to load the `complete_mock_dataset.json` file. They load data on startup, so if they were started before the file existed, they won't have the UTR data.

---

## Quick Fix (3 Steps)

### Step 1: Stop Mock Services

Find the terminals running:
- **Mock Bank** (port 4001)
- **Mock Exchange** (port 4002)

Press `Ctrl+C` in each terminal to stop them.

---

### Step 2: Restart Mock Services

**Terminal 1 - Mock Bank:**
```bash
cd tools/mock_bank
node server.js
```

You should see:
```
✅ Loaded complete mock dataset: 2 UTRs
Mock Bank Server running on port 4001
```

**Terminal 2 - Mock Exchange:**
```bash
cd tools/mock_exchange
node server.js
```

You should see:
```
✅ Loaded complete mock dataset: 2 P2P orders
Mock Exchange Server running on port 4002
```

---

### Step 3: Verify

```bash
# Test mock bank
curl http://localhost:4001/api/bank/utr/UTR-FREEZE-001

# Should return UTR data, not "UTR not found"

# Test mock exchange
curl -X POST http://localhost:4002/api/exchange/lea/query \
  -H "Content-Type: application/json" \
  -d '{"utr":"UTR-FREEZE-001","bank_account_hash":"mule_hash_001_xyz789"}'

# Should return P2P order data
```

---

## Run Diagnostic Again

```bash
node scripts/diagnose_trace_issue.js
```

You should now see:
- ✅ Mock Bank reachable
- ✅ Mock Exchange reachable
- ✅ Trace endpoint working

---

## Test Trace in UI

1. Go to **LEA Dashboard**
2. Find case `CASE-FREEZE-TEST-001`
3. Click **"Run Trace"**
4. Enter UTR: `UTR-FREEZE-001`
5. Wait 10-30 seconds
6. You should see: **"Trace completed! Found 8 asset references"**

---

## Why This Happened

The mock services use **in-memory storage** that loads from JSON files **on startup only**. They don't reload data automatically.

**Solution for future:** The services could be enhanced to:
- Watch for file changes and reload
- Provide a `/reload` endpoint
- Use a database instead of in-memory storage

For now, **restarting is the fix**.

---

## Still Having Issues?

1. **Check file exists:**
   ```bash
   ls -lh demo/complete_mock_dataset.json
   ```

2. **Verify UTR in file:**
   ```bash
   grep "UTR-FREEZE-001" demo/complete_mock_dataset.json
   ```

3. **Check mock bank logs:**
   Look for: `✅ Loaded complete mock dataset: 2 UTRs`

4. **Check backend logs:**
   When you click "Run Trace", watch for detailed error messages

---

## Summary

✅ **Backend is running**  
✅ **Graph is working**  
✅ **Moralis API key is set**  
❌ **Mock services need restart to load new data**

**Fix:** Restart mock_bank and mock_exchange servers.

