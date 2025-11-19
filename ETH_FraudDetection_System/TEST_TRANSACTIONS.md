# 🧪 Test Transaction Endpoint

## Overview

A new test endpoint has been added to simulate transactions and see them appear in your frontend dashboard in real-time.

## ⚠️ Important: Restart Backend First!

**You must restart your backend server** for the new endpoint to be available:

1. Stop the backend server (Ctrl+C in the terminal)
2. Start it again: `npm start`

## 📡 Test Endpoint

**POST** `/api/transactions/test`

### Request Body Options

```json
{
  "type": "eth",        // Optional: "eth", "token", or "nft" (default: "eth")
  "value": "2.5",       // Optional: ETH amount (default: 1.0)
  "from": "0x...",      // Optional: From address (uses tracked address if not provided)
  "to": "0x..."         // Optional: To address (uses another tracked address if available)
}
```

## 🚀 Test Commands

### Windows PowerShell:

#### 1. Test ETH Transfer (Default)
```powershell
Invoke-WebRequest -Uri http://localhost:5000/api/transactions/test -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"type":"eth","value":"2.5"}' | Select-Object -ExpandProperty Content
```

#### 2. Test Token Transfer
```powershell
Invoke-WebRequest -Uri http://localhost:5000/api/transactions/test -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"type":"token","value":"100"}' | Select-Object -ExpandProperty Content
```

#### 3. Test NFT Transfer
```powershell
Invoke-WebRequest -Uri http://localhost:5000/api/transactions/test -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"type":"nft"}' | Select-Object -ExpandProperty Content
```

#### 4. Test with Specific Addresses
```powershell
Invoke-WebRequest -Uri http://localhost:5000/api/transactions/test -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"from":"0xd8da6bf26964af9d7eed9e03e53415d37aa96045","to":"0x742d35cc6634c0532925a3b844bc9e7595f0beb","value":"5.0","type":"eth"}' | Select-Object -ExpandProperty Content
```

### Using curl (if available):

```bash
# ETH Transfer
curl -X POST http://localhost:5000/api/transactions/test \
  -H "Content-Type: application/json" \
  -d '{"type":"eth","value":"2.5"}'

# Token Transfer
curl -X POST http://localhost:5000/api/transactions/test \
  -H "Content-Type: application/json" \
  -d '{"type":"token"}'

# NFT Transfer
curl -X POST http://localhost:5000/api/transactions/test \
  -H "Content-Type: application/json" \
  -d '{"type":"nft"}'
```

## 📊 What Happens

When you send a POST request:

1. ✅ **Backend creates a test transaction** with realistic data
2. ✅ **Stores it** in the transaction history
3. ✅ **Broadcasts via WebSocket** to all connected frontend clients
4. ✅ **Sends webhook** (if configured for the tracked address)
5. ✅ **Appears in frontend** Activity Feed immediately

## 🎯 Expected Results

### In Frontend Dashboard:
- Transaction appears in "Real-Time Activity Feed" within seconds
- Shows transaction details (from, to, value, block number)
- Shows activity type badge (ETH Transfer, Token Transfer, or NFT Transfer)
- Shows balance changes (if address is tracked)
- Updates automatically via WebSocket

### In Backend Terminal:
```
📊 Activity detected on ethereum: {
  hash: '0x...',
  type: 'outgoing',
  from: '0xd8da...',
  to: '0x742d...',
  activities: 1
}
✅ Webhook sent to https://webhook.site/... (if configured)
```

### Response JSON:
```json
{
  "success": true,
  "message": "Test transaction created and broadcasted",
  "transaction": {
    "type": "TRANSACTION",
    "hash": "0x...",
    "from": "0x...",
    "to": "0x...",
    "value": "2500000000000000000",
    "valueEth": "2.5",
    "blockNumber": 23828077,
    "status": "success",
    "activities": [...],
    "balanceChange": {...}
  }
}
```

## 🎨 Test Different Scenarios

### Scenario 1: Simple ETH Transfer
```json
{"type":"eth","value":"1.0"}
```
- Creates a 1 ETH transfer between tracked addresses
- Shows as "ETH Transfer" in dashboard

### Scenario 2: Large Token Transfer
```json
{"type":"token","value":"1000"}
```
- Creates a USDC token transfer
- Shows as "Token Transfer" with contract address

### Scenario 3: NFT Transfer
```json
{"type":"nft"}
```
- Creates an NFT (ERC721) transfer
- Shows as "NFT Transfer" with token ID

### Scenario 4: Custom Amount
```json
{"type":"eth","value":"10.5"}
```
- Creates a 10.5 ETH transfer
- Shows exact amount in dashboard

## 🔍 Verify It's Working

1. **Keep frontend dashboard open** at `http://localhost:3001`
2. **Send POST request** using one of the commands above
3. **Watch the Activity Feed** - transaction should appear immediately
4. **Check backend terminal** - should see activity log
5. **Check webhook site** (if configured) - should receive POST request

## 🐛 Troubleshooting

### "Cannot POST /api/transactions/test"
- **Solution**: Restart the backend server

### Transaction doesn't appear in frontend
- Check WebSocket connection (should show "Connected" in dashboard)
- Check browser console for errors
- Verify backend is broadcasting (check terminal logs)

### No tracked addresses error
- Add at least one address first: `POST /api/track/address`

## 🎉 Enjoy Testing!

This endpoint is perfect for:
- ✅ Testing the dashboard UI
- ✅ Demonstrating real-time updates
- ✅ Testing webhook delivery
- ✅ Showing different activity types
- ✅ Development and debugging

