# 🔍 Debugging Trace-and-Update 500 Error

## Quick Fix Guide

If you're seeing `500 Internal Server Error` when clicking "Run Trace", follow these steps:

---

## Step 1: Run Diagnostic Script

```bash
cd /Users/harshita_shar25/Documents/ETH_FraudDetection_System/ETH_FraudDetection_System
node scripts/diagnose_trace_issue.js
```

This will check:
- ✅ Backend API (port 4000)
- ✅ Mock Bank (port 4001)
- ✅ Mock Exchange (port 4002)
- ✅ Neo4j / Memory Graph
- ✅ Moralis API Key
- ✅ Fabric Storage
- ✅ Trace Endpoint

**Fix any issues it reports before proceeding.**

---

## Step 2: Check Backend Logs

When you click "Run Trace" in the UI, watch your backend terminal. You should see detailed logs like:

```
🔍 [TRACE-AND-UPDATE] Starting for caseId=CASE-FREEZE-TEST-001, utr=UTR-FREEZE-001
📋 Step 1: Fetching UTR details from bank...
✅ Bank data retrieved: ...
```

**If you see an error, it will tell you exactly which step failed.**

---

## Step 3: Common Issues & Fixes

### Issue 1: "Bank adapter not reachable"
**Fix:**
```bash
cd tools/mock_bank
node server.js
```
Should show: `Mock Bank Server running on port 4001`

### Issue 2: "Exchange adapter not reachable"
**Fix:**
```bash
cd tools/mock_exchange
node server.js
```
Should show: `Mock Exchange Server running on port 4002`

### Issue 3: "Case not found"
**Fix:** The endpoint will auto-create the case, but if you see this error, the Fabric storage might be locked. Check:
```bash
ls -la backend/data/fabric_cases.json
```

### Issue 4: "Neo4j connection failed"
**Fix:** Either:
- Set `USE_MEMORY_GRAPH=true` in `.env` (recommended for PoC)
- Or fix Neo4j connection (see `NEO4J_BROWSER_SETUP.md`)

### Issue 5: "Moralis API error"
**Fix:** 
- Check `.env` has `MORALIS_API_KEY=...`
- Or it will use synthetic data (should still work)

---

## Step 4: Test with curl

Test the endpoint directly:

```bash
curl -v -X POST http://localhost:4000/api/freeze/trace-and-update \
  -H "Content-Type: application/json" \
  -d '{"caseId":"CASE-TEST-001","utr":"UTR-FREEZE-001"}' \
  --max-time 60
```

**Check the response:**
- If `200 OK` → Endpoint works, issue is in frontend
- If `500` → Check response body for error details
- If `ECONNREFUSED` → Backend not running

---

## Step 5: Check Frontend Network Tab

1. Open browser DevTools (F12)
2. Go to Network tab
3. Click "Run Trace"
4. Find the `trace-and-update` request
5. Check:
   - **Status Code** (should be 200)
   - **Request Payload** (should have `caseId` and `utr`)
   - **Response** (if 500, check error message)

---

## Step 6: Verify All Services Running

```bash
# Terminal 1: Backend
cd backend && npm start

# Terminal 2: Mock Bank
cd tools/mock_bank && node server.js

# Terminal 3: Mock Exchange
cd tools/mock_exchange && node server.js

# Terminal 4: Frontend (if needed)
cd frontend && npm start
```

---

## Step 7: Check .env File

Make sure `.env` has:

```bash
# Graph
USE_MEMORY_GRAPH=true  # or set Neo4j credentials

# Moralis (optional)
MORALIS_API_KEY=your_key_here

# Service URLs
MOCK_BANK_URL=http://localhost:4001
MOCK_EXCHANGE_URL=http://localhost:4002
API_BASE_URL=http://localhost:4000
```

---

## What the New Error Handling Shows

The improved error handling will now show:

1. **Which step failed:**
   - `step: 'trace_execution'` → Error during trace
   - `step: 'trace_validation'` → Trace returned but failed
   - `step: 'asset_extraction'` → Couldn't extract assets
   - `step: 'case_update'` → Couldn't update case
   - `step: 'unexpected_error'` → Unknown error

2. **Detailed error messages:**
   - Connection errors: "Bank adapter not reachable at http://localhost:4001"
   - Data errors: "Exchange returned no order for UTR..."
   - Validation errors: "Bank data missing remitter or account_hash"

3. **Stack traces** (in development mode)

---

## Quick Test Commands

```bash
# 1. Test backend health
curl http://localhost:4000/api/health

# 2. Test mock bank
curl http://localhost:4001/api/bank/utr/UTR-FREEZE-001

# 3. Test mock exchange
curl -X POST http://localhost:4002/api/exchange/lea/query \
  -H "Content-Type: application/json" \
  -d '{"utr":"UTR-FREEZE-001","bank_account_hash":"test"}'

# 4. Test trace endpoint
curl -X POST http://localhost:4000/api/freeze/trace-and-update \
  -H "Content-Type: application/json" \
  -d '{"caseId":"CASE-TEST","utr":"UTR-FREEZE-001"}'
```

---

## Still Not Working?

1. **Run diagnostic script** and share output
2. **Check backend logs** and share error stack trace
3. **Test with curl** and share response
4. **Verify all services running** (ports 4000, 4001, 4002)

The new error handling should make it very clear what's wrong!

