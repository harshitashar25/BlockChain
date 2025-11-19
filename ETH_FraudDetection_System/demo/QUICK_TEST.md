# Quick Test Guide - Test the System in 5 Minutes

## 🚀 Quick Test Steps

### Step 1: Start Services

```bash
# Make sure Neo4j is running
neo4j start

# Start all services (use the startup script)
./start-services.sh

# OR start manually in 4 terminals:
# Terminal 1: cd backend && npm start
# Terminal 2: cd tools/mock_bank && npm start  
# Terminal 3: cd tools/mock_exchange && npm start
# Terminal 4: cd frontend && npm start
```

### Step 2: Test in UI (2 minutes)

1. **Open**: http://localhost:3000
2. **Go to**: "Bank Report" (left sidebar)
3. **Fill form**:
   - Case ID: `CASE-TEST-001`
   - UTR: `UTR123456789`
   - Amount: `100000`
4. **Click**: "Submit Fraud Report"
5. **Check**: Dashboard should show the new case

### Step 3: Test Freeze Flow (2 minutes)

1. **Go to**: "LEA Queue" (left sidebar)
2. **Find**: Your case (`CASE-TEST-001`)
3. **Click**: "Approve Freeze" button (do this twice with different approvers)
4. **Check**: Status should change to "FREEZE_ACTIVE"
5. **Verify**: Bank hold should be placed automatically

### Step 4: Test Trace (1 minute)

1. **Go to**: "Investigator Trace"
2. **Enter seed**: `chain:0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb`
3. **Click**: "Trace"
4. **View**: Graph visualization should appear

## ✅ Expected Results

- ✅ Case appears in Dashboard
- ✅ Case can be approved in LEA Queue
- ✅ Freeze activates after 2 approvals
- ✅ Trace finds paths to exchange endpoints
- ✅ Evidence hash is generated and stored

## 🐛 Troubleshooting

**Case not appearing?**
- Check backend logs: `cd backend && npm start`
- Verify mock bank is running: `curl http://localhost:4001/api/bank/health`

**Freeze not activating?**
- Need 2 approvals (click "Approve Freeze" twice)
- Check backend logs for errors

**Trace not working?**
- Verify Neo4j is running: `neo4j status`
- Check Neo4j Browser: http://localhost:7474
- Run: `MATCH (n) RETURN n LIMIT 25`

## 📊 Test Data Available

Use these UTRs for testing:
- `UTR123456789` - ₹100,000 case
- `UTR987654321` - ₹25,000 case  
- `UTR555666777` - ₹500,000 case

## 🎯 Next Steps

Once basic flow works:
1. Run full E2E demo: `node demo/runner.js`
2. Check Neo4j graph: http://localhost:7474
3. View evidence bundles: Check `demo/` folder
4. Test with different UTRs

