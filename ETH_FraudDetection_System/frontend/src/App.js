import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

// Import Components
import HomePage from './components/HomePage';
import LeaDashboard from './LeaDashboard';
import BankA_UI from './BankA_UI';
import BankB_UI from './BankB_UI';
import BlockchainMonitorDashboard from './components/BlockchainMonitorDashboard';

// Import ABI (JSON file is created by Hardhat compile)
import FraudLedgerABI from './FraudLedger.json'; 

// IMPORTANT: Replace this with the address printed by Hardhat's deploy script!
const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; 

function App() {
  const [view, setView] = useState('home'); // 'home', 'wallet-intelligence', or 'bank-monitoring'
  const [contract, setContract] = useState(null);

  useEffect(() => {
    // Function to initialize the blockchain connection
    const initEthers = async () => {
      try {
        // 1. Create a provider for the local Hardhat node
        const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545/");
        
        // 2. Get the signer (the first account from Hardhat's node)
        // This signer will be used for state-changing transactions (reportFraud, triggerProvisionalHold).
        const signer = provider.getSigner(); 

        // 3. Create the contract instance
        const fraudLedgerContract = new ethers.Contract(
          contractAddress,
          FraudLedgerABI.abi, // Use the ABI data
          signer // Pass the signer for transactions
        );

        // 4. Set the contract instance in state
        setContract(fraudLedgerContract);
        console.log("Contract successfully connected and set in state.");

      } catch (error) {
        console.error("Error connecting to blockchain:", error);
        // Show user an error in a production app
      }
    };

    initEthers();
  }, []); // Empty dependency array ensures it runs once on load

  const handleNavigate = (newView) => {
    setView(newView);
  };

  // Navigation style - Light mode
  const navStyle = {
    display: 'flex',
    gap: '8px',
    padding: '16px 32px',
    background: '#ffffff',
    borderBottom: '1px solid #e5e7eb',
    alignItems: 'center',
  };

  const navButtonStyle = (isActive) => ({
    padding: '10px 20px',
    fontSize: '14px',
    background: isActive ? '#2563eb' : 'transparent',
    color: isActive ? '#ffffff' : '#4b5563',
    border: isActive ? 'none' : '1px solid #e5e7eb',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    transition: 'all 0.2s',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  });

  // Simple style for a 3-column layout
  const appStyle = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '24px',
    padding: '32px',
    maxWidth: '1400px',
    margin: '0 auto',
    background: '#f9fafb',
    minHeight: 'calc(100vh - 73px)',
  };

  // Home Page View
  if (view === 'home') {
    return (
      <div>
        <div style={navStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginRight: 'auto' }}>
            <div style={{ fontSize: '20px' }}>🔍</div>
            <span style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>
              Fraud Traceability System
            </span>
          </div>
          <button 
            style={navButtonStyle(view === 'wallet-intelligence')}
            onClick={() => setView('wallet-intelligence')}
          >
            Blockchain Transaction Intelligence
          </button>
          <button 
            style={navButtonStyle(view === 'bank-monitoring')}
            onClick={() => setView('bank-monitoring')}
          >
            Cross-Bank Fraud Monitoring
          </button>
        </div>
        <HomePage onNavigate={handleNavigate} />
      </div>
    );
  }

  // Wallet Intelligence View (Blockchain Monitor)
  if (view === 'wallet-intelligence') {
    return (
      <div style={{ background: '#f9fafb', minHeight: '100vh' }}>
        <div style={navStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginRight: 'auto' }}>
            <div style={{ fontSize: '20px' }}>🔍</div>
            <span style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>
              Fraud Traceability System
            </span>
          </div>
          <button 
            style={navButtonStyle(false)}
            onClick={() => setView('home')}
          >
            Home
          </button>
          <button 
            style={navButtonStyle(view === 'wallet-intelligence')}
            onClick={() => setView('wallet-intelligence')}
          >
            Blockchain Transaction Intelligence
          </button>
          <button 
            style={navButtonStyle(view === 'bank-monitoring')}
            onClick={() => setView('bank-monitoring')}
          >
            Cross-Bank Fraud Monitoring
          </button>
        </div>
        <BlockchainMonitorDashboard />
      </div>
    );
  }

  // Bank Monitoring View (Fraud Detection System)
  if (!contract) {
    return (
      <div style={{ background: '#f9fafb', minHeight: '100vh' }}>
        <div style={navStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginRight: 'auto' }}>
            <div style={{ fontSize: '20px' }}>🔍</div>
            <span style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>
              Fraud Traceability System
            </span>
          </div>
          <button 
            style={navButtonStyle(false)}
            onClick={() => setView('home')}
          >
            Home
          </button>
          <button 
            style={navButtonStyle(view === 'wallet-intelligence')}
            onClick={() => setView('wallet-intelligence')}
          >
            Blockchain Transaction Intelligence
          </button>
          <button 
            style={navButtonStyle(view === 'bank-monitoring')}
            onClick={() => setView('bank-monitoring')}
          >
            Cross-Bank Fraud Monitoring
          </button>
        </div>
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#111827' }}>
            Connecting to blockchain...
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#f9fafb', minHeight: '100vh' }}>
      <div style={navStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginRight: 'auto' }}>
          <div style={{ fontSize: '20px' }}>🔍</div>
          <span style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>
            Fraud Traceability System
          </span>
        </div>
        <button 
          style={navButtonStyle(false)}
          onClick={() => setView('home')}
        >
          Home
        </button>
        <button 
          style={navButtonStyle(view === 'wallet-intelligence')}
          onClick={() => setView('wallet-intelligence')}
        >
          Blockchain Transaction Intelligence
        </button>
        <button 
          style={navButtonStyle(view === 'bank-monitoring')}
          onClick={() => setView('bank-monitoring')}
        >
          Cross-Bank Fraud Monitoring
        </button>
      </div>
      <div style={appStyle}>
        {/* 1. Bank A (Reporting) UI */}
        <BankA_UI contract={contract} /> 

        {/* 2. LEA Dashboard (Listening & Freezing) UI */}
        <LeaDashboard contract={contract} /> 

        {/* 3. Bank B (Receiving/Listening) UI */}
        <BankB_UI contract={contract} /> 
      </div>
    </div>
  );
}

export default App;
