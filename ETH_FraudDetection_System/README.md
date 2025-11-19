# Fraud Ledger Hackathon MVP

A complete blockchain-based fraud detection and freezing system demonstrating real-time event listening and contract interactions.

## 🏗️ Project Structure

```
corda/
├── blockchain/          # Hardhat blockchain project
│   ├── contracts/       # Solidity smart contracts
│   ├── scripts/         # Deployment scripts
│   └── package.json     # Blockchain dependencies
└── frontend/            # React frontend application
    └── src/             # React components
```

## 🚀 Quick Start Guide

### Part A: Setup the Hardhat Backend

1. **Navigate to blockchain directory:**
   ```bash
   cd blockchain
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Compile the contract:**
   ```bash
   npm run compile
   ```
   This creates the ABI file needed for the frontend.

### Part B: Setup the React Frontend

1. **Navigate to frontend directory:**
   ```bash
   cd ../frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Copy the ABI file (CRUCIAL STEP):**
   ```bash
   cp ../blockchain/artifacts/contracts/FraudLedger.sol/FraudLedger.json ./src/
   ```

### Part C: Run the Project

You will need **three separate terminal windows**:

#### Terminal 1: Run the Local Blockchain Node
```bash
cd blockchain
npm run node
```
*(Leave this running - it's your local blockchain)*

#### Terminal 2: Deploy the Contract
```bash
cd blockchain
npm run deploy
```
**IMPORTANT:** Copy the deployed contract address that gets printed!

#### Terminal 3: Start the Frontend
1. **Update the contract address in `frontend/src/App.js`:**
   - Open `frontend/src/App.js`
   - Replace `contractAddress` with the address from Terminal 2

2. **Start the React app:**
   ```bash
   cd frontend
   npm start
   ```

The browser will open to `http://localhost:3000` showing all three components.

## 🎯 Demo Flow

1. **Bank A (Left Panel):** Fill in Case ID, Receiving Account, and Amount, then click "Report Fraud"
2. **LEA Dashboard (Middle Panel):** Instantly sees the fraud alert appear, clicks "Freeze Funds"
3. **Bank B (Right Panel):** Sees the "FROZEN" status update in real-time

## 📋 Components

- **FraudLedger.sol**: Smart contract with fraud reporting and freezing functionality
- **LeaDashboard.js**: Real-time fraud alert monitoring and freeze action
- **BankA_UI.js**: Fraud reporting interface
- **BankB_UI.js**: Real-time status monitoring for receiving bank
- **App.js**: Main React app connecting all components

## 🔧 Technology Stack

- **Solidity** ^0.8.0 - Smart contract language
- **Hardhat** - Development environment and local blockchain
- **React** - Frontend framework
- **Ethers.js** - Blockchain interaction library

## ⚠️ Important Notes

- The contract uses `msg.sender` checks - ensure you're using the correct signer account
- The contract address must be updated in `App.js` after each deployment
- The Hardhat node must be running before starting the frontend
- All three components share the same contract instance for real-time updates

