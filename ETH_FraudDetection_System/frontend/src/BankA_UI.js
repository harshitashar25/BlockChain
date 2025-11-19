import React, { useState } from 'react';

const BankA_UI = ({ contract }) => {
  const [caseId, setCaseId] = useState('');
  const [toAccount, setToAccount] = useState('');
  const [amount, setAmount] = useState('');
  const fromAccount = "Account-A-123"; // Static reporting account

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!contract || !caseId || !toAccount || !amount) {
      alert("Please fill all fields and ensure contract is loaded.");
      return;
    }

    try {
      // Calls reportFraud on the contract
      const tx = await contract.reportFraud(
        caseId,
        fromAccount,
        toAccount,
        // Convert amount to a number/BigNumber if needed, but for MVP keep it as a string for ethers
        amount 
      );
      await tx.wait(); // Wait for the transaction to be mined
      console.log("Fraud Reported!");
      alert(`Fraud Reported successfully! Case ID: ${caseId}`);

      // Clear the form
      setCaseId('');
      setToAccount('');
      setAmount('');
    } catch (error) {
      console.error("Error reporting fraud:", error);
      alert(`Failed to report fraud. See console for details. (Ensure you are using the 'bankAddress' signer)`);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Fraud Reporting Portal</h2>
        <p style={styles.subtitle}>Report fraudulent transactions for investigation</p>
      </div>
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.formGroup}>
          <label style={styles.label}>
            Case ID (Unique Identifier)
          </label>
          <input 
            type="text" 
            value={caseId} 
            onChange={(e) => setCaseId(e.target.value)} 
            required 
            style={styles.input}
            placeholder="Enter unique case ID"
          />
        </div>
        
        <div style={styles.formGroup}>
          <label style={styles.label}>
            Receiving Account (Destination)
          </label>
          <input 
            type="text" 
            value={toAccount} 
            onChange={(e) => setToAccount(e.target.value)} 
            required 
            style={styles.input}
            placeholder="Enter receiving account number"
          />
        </div>
        
        <div style={styles.formGroup}>
          <label style={styles.label}>
            Amount (Transaction Value)
          </label>
          <input 
            type="number" 
            value={amount} 
            onChange={(e) => setAmount(e.target.value)} 
            required 
            min="1"
            style={styles.input}
            placeholder="Enter transaction amount"
          />
        </div>
        
        <div style={styles.infoBox}>
          <span style={styles.infoLabel}>Reporting Account:</span>
          <span style={styles.infoValue}>{fromAccount}</span>
        </div>
        
        <button type="submit" style={styles.submitButton}>
          Report Fraud Case
        </button>
      </form>
    </div>
  );
};

const styles = {
  container: {
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '32px',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  header: {
    marginBottom: '32px',
    paddingBottom: '24px',
    borderBottom: '1px solid #e5e7eb',
  },
  title: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#111827',
    margin: '0 0 8px 0',
  },
  subtitle: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0,
    fontWeight: '400',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
  },
  input: {
    padding: '12px 16px',
    fontSize: '14px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    background: '#ffffff',
    color: '#111827',
    transition: 'all 0.2s',
    fontFamily: 'inherit',
  },
  infoBox: {
    padding: '16px',
    background: '#f9fafb',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#6b7280',
  },
  infoValue: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'monospace',
  },
  submitButton: {
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: '600',
    background: '#dc2626',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
};

export default BankA_UI;
