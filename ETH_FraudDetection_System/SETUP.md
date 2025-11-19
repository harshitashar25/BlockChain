# Step-by-Step Setup Guide

Follow these instructions exactly to get your Fraud Ledger MVP running.

## Prerequisites

- Node.js (v14 or higher) and npm installed
- A code editor (VS Code recommended)

## Step 1: Install Blockchain Dependencies

Open Terminal and run:

```bash
cd blockchain
npm install
```

This installs Hardhat and all blockchain development tools.

## Step 2: Compile the Smart Contract

Still in the `blockchain` directory:

```bash
npm run compile
```

**Expected output:** You should see "Compiled X Solidity file(s) successfully"

This creates the ABI file in `blockchain/artifacts/contracts/FraudLedger.sol/FraudLedger.json`

## Step 3: Install Frontend Dependencies

Open a new terminal window (keep the first one for later):

```bash
cd frontend
npm install
```

This installs React and Ethers.js.

## Step 4: Copy the ABI File

**CRITICAL STEP:** Copy the compiled ABI to the frontend:

```bash
cp ../blockchain/artifacts/contracts/FraudLedger.sol/FraudLedger.json ./src/
```

This allows the React app to communicate with your smart contract.

## Step 5: Start the Local Blockchain

In your first terminal (or a new one), navigate to blockchain and start Hardhat node:

```bash
cd blockchain
npm run node
```

**Expected output:** You'll see "Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/"

**IMPORTANT:** Leave this terminal running! This is your local blockchain.

## Step 6: Deploy the Contract

Open a **second terminal window**:

```bash
cd blockchain
npm run deploy
```

**Expected output:** 
```
FraudLedger contract deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
```

**COPY THIS ADDRESS!** You'll need it in the next step.

## Step 7: Update Contract Address in Frontend

1. Open `frontend/src/App.js` in your code editor
2. Find the line: `const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";`
3. Replace the address with the one from Step 6
4. Save the file

## Step 8: Start the Frontend

In a **third terminal window**:

```bash
cd frontend
npm start
```

**Expected output:** Your browser should automatically open to `http://localhost:3000`

You should see three panels:
- **Left:** Bank A (Report Fraud)
- **Middle:** LEA Dashboard (Real-Time)
- **Right:** Bank B (Receiving Bank)

## 🎉 Testing the Flow

1. In the **Bank A** panel, fill in:
   - Case ID: `CASE-001`
   - Receiving Account: `Account-B-456`
   - Amount: `1000`
   - Click "Report Fraud"

2. Watch the **LEA Dashboard** - the alert should appear instantly!

3. Click **"Freeze Funds"** button in the LEA Dashboard

4. Watch the **Bank B** panel - it should turn red and show "FROZEN" status!

## Troubleshooting

### "Connecting to blockchain..." message won't go away
- Make sure Hardhat node is running (Step 5)
- Check that the contract address in `App.js` matches the deployed address

### "Only the designated Bank can report fraud" error
- The contract uses `msg.sender` checks
- Make sure you're using the first account from Hardhat (default signer)

### ABI file not found
- Make sure you compiled the contract (Step 2)
- Verify the ABI file exists: `blockchain/artifacts/contracts/FraudLedger.sol/FraudLedger.json`
- Re-run Step 4 to copy it

### Port 3000 already in use
- Close other React apps or change the port:
  ```bash
  PORT=3001 npm start
  ```

## Next Steps

Once everything is working, you can:
- Customize the UI styling
- Add more validation
- Implement additional contract functions
- Add error handling and user feedback

