# 🚀 Quick Start - Blockchain Monitoring Service

Get your complete blockchain monitoring system up and running in minutes!

## 📋 Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Two terminal windows

## 🎯 Step-by-Step Setup

### Step 1: Start the Backend Server

Open **Terminal 1**:

```bash
cd ETH_FraudDetection_System/backend

# Install dependencies (first time only)
npm install

# Create .env file
# Copy the content from .env.example or create manually:
# PORT=5000
# ETHEREUM_RPC_URL=https://eth.llamarpc.com
# ETHEREUM_WS_URL=wss://eth.llamarpc.com
# CHAIN_NAME=ethereum

# Start the server
npm start
```

You should see:
```
✅ Server running on port 5000
📡 WebSocket server ready: ws://localhost:5000
🔍 Blockchain monitoring active for ethereum
```

### Step 2: Start the Frontend Dashboard

Open **Terminal 2**:

```bash
cd ETH_FraudDetection_System/frontend

# Install dependencies (first time only)
npm install

# Start the React app
npm start
```

The dashboard will open automatically at `http://localhost:3001`

### Step 3: Add an Address to Track

1. In the dashboard, find the "Add Address to Track" section
2. Enter an Ethereum address (e.g., `0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045`)
3. Click "Track Address"
4. The address will appear in the "Tracked Addresses" section

### Step 4: Watch Real-Time Activity

- Activities will appear in the "Real-Time Activity Feed" as they happen
- Use filter buttons to view specific activity types
- Click "View on Etherscan" to see full transaction details

## 🧪 Test the System

### Test 1: Add a Popular Wallet

Try tracking Vitalik's wallet:
```
0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045
```

This wallet has frequent activity, so you'll see transactions appear quickly.

### Test 2: Configure a Webhook

1. Click "Configure Webhook" on a tracked address
2. Use a test webhook service like [webhook.site](https://webhook.site)
3. Copy your unique webhook URL
4. Paste it and click "Save"
5. Watch for incoming POST requests when activity is detected

### Test 3: Filter Activities

Use the filter buttons:
- **ETH** - See only native ETH transfers
- **Token** - See ERC20 token transfers
- **NFT** - See NFT transfers
- **Contract** - See contract interactions

## 📊 What You'll See

### Dashboard Header
- Connection status (green = connected)
- Current blockchain block number
- Service title

### Stats Cards
- Number of tracked wallets
- Number of tracked contracts
- Total activities detected
- Network name

### Activity Feed
Each activity shows:
- **Type** - ETH Transfer, Token Transfer, NFT Transfer, or Contract Call
- **From/To** - Wallet addresses (⭐ = tracked address)
- **Value** - Amount in ETH or tokens
- **Block** - Block number
- **Status** - Success or failed
- **Balance Change** - Before/after balance
- **Sub-activities** - Token transfers, NFT transfers, etc.

## 🔧 Troubleshooting

### Backend won't start
- Check if port 5000 is already in use
- Verify Node.js is installed: `node --version`
- Check `.env` file exists and has correct values

### Frontend won't connect
- Make sure backend is running first
- Check browser console for errors
- Verify API URL in frontend `.env` file

### No activities showing
- Make sure you've added an address to track
- Wait for new blocks (Ethereum ~12 seconds per block)
- Try a wallet with recent activity

### WebSocket disconnected
- Backend will automatically reconnect
- Check backend server is still running
- Verify WebSocket URL in frontend

## 🎯 Example Workflow

1. **Start Backend** → `cd backend && npm start`
2. **Start Frontend** → `cd frontend && npm start`
3. **Add Address** → Enter `0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045`
4. **Watch Feed** → See transactions appear in real-time
5. **Configure Webhook** → Set up notifications
6. **Filter Activities** → View specific transaction types

## 📚 Next Steps

- Add more addresses to track
- Set up webhooks for your fraud detection system
- Monitor multiple wallets simultaneously
- Use the API to integrate with your own systems

## 🎉 You're All Set!

Your blockchain monitoring service is now running and tracking wallet activity in real-time!

---

**Need Help?**
- Check `backend/README.md` for API documentation
- Check `frontend/FRONTEND_DASHBOARD_README.md` for dashboard features
- Check `BLOCKCHAIN_MONITORING_PLAN.md` for architecture details

