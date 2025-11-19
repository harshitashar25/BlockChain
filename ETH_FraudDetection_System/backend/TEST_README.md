# 🧪 Test Scripts for Transaction Trail System

## Quick Start

### Prerequisites
1. **Backend server must be running** on `http://localhost:5000`
2. Start the server: `npm start`

### Run Tests

#### Option 1: Simple Quick Test
```bash
node test-simple.js
```

This will:
- Add 2 wallets to track
- Create 3 test transactions
- Quick verification

#### Option 2: Comprehensive Test Suite
```bash
npm test
# or
node test-trail-system.js
```

This will:
- Add 4 wallets to track
- Create multiple test transactions (ETH, Token, NFT)
- Test all trail endpoints
- Display detailed results

## What the Tests Do

### Simple Test (`test-simple.js`)
1. ✅ Adds 2 wallets to tracking
2. ✅ Creates 3 test transactions
3. ✅ Quick verification

### Comprehensive Test (`test-trail-system.js`)
1. ✅ Health check
2. ✅ Adds 4 wallets to tracking
3. ✅ Creates 7+ test transactions:
   - ETH transfers
   - Token transfers (ERC20)
   - NFT transfers (ERC721)
4. ✅ Tests all trail endpoints:
   - Transaction trail
   - Address statistics
   - Connected addresses
   - Flow between addresses
   - Path finding
   - Graph data

## Expected Output

### Simple Test Output:
```
🚀 Quick Wallet Tracking Test

📝 Adding wallets to track...
  ✅ Added wallet 1
  ✅ Added wallet 2

💸 Creating test transactions...
  ✅ Created ETH transaction 1
  ✅ Created ETH transaction 2
  ✅ Created Token transaction

✅ Test complete! Check your dashboard at http://localhost:3001
```

### Comprehensive Test Output:
```
🚀 Starting Transaction Trail System Tests
============================================================

📡 Testing Health Check...
✅ Server is running: ok

📝 Step 1: Adding Wallets to Track...
  ✅ Added: 0xd8dA6BF...
  ✅ Added: 0x742d35C...
  ...

💸 Step 2: Creating Test Transactions...
  ✅ Created eth tx: 1.5 ETH from 0xd8dA6BF... to 0x742d35C...
  ✅ Created eth tx: 2.0 ETH from 0xd8dA6BF... to 0x742d35C...
  ✅ Created token tx: 100 ETH from 0xd8dA6BF... to 0x742d35C...
  ...

🔍 Step 3: Testing Trail Endpoints...
📊 Testing Trail for 0xd8dA6BF...
  📊 Trail found: 3 paths, 3 transactions
📈 Testing Stats for 0xd8dA6BF...
  📈 Stats: 3 outgoing, 0 incoming, 4.5 ETH sent
...

✅ Test Suite Completed!
```

## Troubleshooting

### "Server not responding"
- Make sure backend is running: `npm start`
- Check if port 5000 is available
- Verify server started successfully

### "Cannot add wallet"
- Check if wallet address format is correct
- Verify backend is processing requests
- Check backend console for errors

### "No transactions created"
- Verify wallets were added successfully
- Check backend console for transaction creation logs
- Ensure test script can reach the API

## Manual Testing

You can also test manually using curl/PowerShell:

```powershell
# Add wallet
Invoke-WebRequest -Uri http://localhost:5000/api/track/address -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"address":"0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"}'

# Create transaction
Invoke-WebRequest -Uri http://localhost:5000/api/transactions/test -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"type":"eth","value":"1.0"}'

# Get trail
Invoke-WebRequest -Uri "http://localhost:5000/api/trail/0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045?hops=5"
```

## Continuous Testing

To continuously test (create transactions every few seconds):

```bash
# Run simple test in a loop
while true; do
  node test-simple.js
  sleep 10
done
```

## Next Steps

After running tests:
1. ✅ Check frontend dashboard at `http://localhost:3001`
2. ✅ View transactions in Activity Feed
3. ✅ Test trail endpoints manually
4. ✅ Build visualization using graph data

## Files

- `test-simple.js` - Quick test (30 seconds)
- `test-trail-system.js` - Comprehensive test (2-3 minutes)
- `TEST_README.md` - This file

