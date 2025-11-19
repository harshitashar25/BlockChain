import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

// Import Components
import HomePage from './components/HomePage';
import LeaDashboard from './LeaDashboard';
import BankA_UI from './BankA_UI';
import BankB_UI from './BankB_UI';
import BlockchainMonitorDashboard from './components/BlockchainMonitorDashboard';
import Sidebar from './components/Sidebar';
import OSINTPlaceholder from './components/OSINTPlaceholder';

// Import ABI (JSON file is created by Hardhat compile)
import FraudLedgerABI from './FraudLedger.json'; 

// IMPORTANT: Replace this with the address printed by Hardhat's deploy script!
const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; 

function App() {
  const [view, setView] = useState('wallet-intelligence'); // 'wallet-intelligence', 'bank-monitoring', or 'osint'
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

  // Layout wrapper style - accounts for sidebar
  const layoutStyle = {
    display: 'flex',
    minHeight: '100vh',
    background: '#f9fafb'
  };

  // Main content area style - accounts for sidebar width
  const mainContentStyle = {
    marginLeft: '280px',
    flex: 1,
    minHeight: '100vh',
    background: '#f9fafb',
    width: 'calc(100% - 280px)'
  };

  // Simple style for a 3-column layout (Bank Monitoring)
  const appStyle = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '24px',
    padding: '32px',
    maxWidth: '1400px',
    margin: '0 auto',
    background: '#f9fafb',
    minHeight: '100vh'
  };

  // Render content based on view
  const renderContent = () => {
    // OSINT View
    if (view === 'osint') {
      return <OSINTPlaceholder />;
    }

    // Wallet Intelligence View (Blockchain Monitor)
    if (view === 'wallet-intelligence') {
      return <BlockchainMonitorDashboard />;
    }

    // Bank Monitoring View (Fraud Detection System)
    if (view === 'bank-monitoring') {
      // Show loading state if contract not ready
      if (!contract) {
        return (
          <div style={{ padding: '40px', textAlign: 'center', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#111827' }}>
                Connecting to blockchain...
              </h1>
            </div>
          </div>
        );
      }

      return (
        <div style={appStyle}>
          {/* 1. Bank A (Reporting) UI */}
          <BankA_UI contract={contract} /> 

          {/* 2. LEA Dashboard (Listening & Freezing) UI */}
          <LeaDashboard contract={contract} /> 

          {/* 3. Bank B (Receiving/Listening) UI */}
          <BankB_UI contract={contract} /> 
        </div>
      );
    }

    // Default fallback
    return <BlockchainMonitorDashboard />;
  };

  return (
    <div style={layoutStyle}>
      {/* Sidebar Navigation */}
      <Sidebar activeView={view} onNavigate={handleNavigate} />
      
      {/* Main Content Area */}
      <div style={mainContentStyle} className="main-content-responsive">
        {renderContent()}
      </div>
    </div>
  );
}

export default App;
