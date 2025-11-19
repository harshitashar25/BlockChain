# 🚀 Quick Start - Run These Commands

## Step 1: Start Hardhat Node (Terminal 1)
```bash
cd blockchain
npm run node
```
**Keep this terminal running!** This is your local blockchain.

## Step 2: Deploy Contract (Terminal 2 - NEW TERMINAL)
```bash
cd blockchain
npm run deploy
```
**COPY THE CONTRACT ADDRESS** that gets printed (e.g., `0x5FbDB2315678afecb367f032d93F642f64180aa3`)

## Step 3: Update Contract Address
Open `frontend/src/App.js` and replace line 13:
```javascript
const contractAddress = "PASTE_YOUR_DEPLOYED_ADDRESS_HERE";
```

## Step 4: Start Frontend (Terminal 3 - NEW TERMINAL)
```bash
cd frontend
npm start
```
Browser will open at `http://localhost:3000`

## 🎯 Test the Flow:
1. **Bank A (left):** Enter Case ID, Receiving Account, Amount → Click "Report Fraud"
2. **LEA Dashboard (middle):** See alert appear → Click "Freeze Funds"  
3. **Bank B (right):** See "FROZEN" status update!

