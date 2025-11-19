import React, { useState, useEffect } from 'react';

const LeaDashboard = ({ contract }) => {
  const [alerts, setAlerts] = useState([]); // State to store reported cases

  // Function to call the contract's freeze function
  const handleFreeze = async (caseId) => {
    try {
      console.log(`Attempting to freeze funds for Case ID: ${caseId}`);
      // Calls the triggerProvisionalHold function on the contract
      const tx = await contract.triggerProvisionalHold(caseId);
      await tx.wait(); // Wait for the transaction to be mined
      console.log(`Freeze transaction submitted for Case ID: ${caseId}`);
      // Update UI to reflect 'Pending' or remove item, based on preference, 
      // but for this MVP we rely on the Bank B to confirm 'FROZEN'.
    } catch (error) {
      console.error("Error triggering provisional hold:", error);
    }
  };

  useEffect(() => {
    // Only set up listener if the contract object is available
    if (contract) {
      // Set up listener for the 'FraudReported' event
      const fraudReportedListener = (caseId, from, to, amount) => {
        const newAlert = {
          id: caseId,
          from: from,
          to: to,
          // Convert amount (BigNumber) to string for display
          amount: amount.toString(), 
          status: 'Reported' // Not explicitly in contract, but useful for display
        };
        // Add the new alert to the state array
        setAlerts((prevAlerts) => [...prevAlerts, newAlert]);
        console.log(`New Fraud Reported: Case ${caseId}`);
      };

      contract.on("FraudReported", fraudReportedListener);

      // Cleanup function to remove the listener when the component unmounts
      return () => {
        contract.off("FraudReported", fraudReportedListener);
      };
    }
  }, [contract]); // Rerun effect if the contract instance changes

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Law Enforcement Authority Dashboard</h2>
        <p style={styles.subtitle}>Real-time fraud alerts and fund freezing controls</p>
      </div>
      
      {alerts.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>🛡️</div>
          <p style={styles.emptyText}>No active fraud alerts</p>
          <p style={styles.emptySubtext}>Fraud cases will appear here in real-time</p>
        </div>
      ) : (
        <div style={styles.alertsList}>
          {alerts.map((alert) => (
            <div key={alert.id} style={styles.alertCard}>
              <div style={styles.alertHeader}>
                <div style={styles.alertBadge}>⚠️ Fraud Alert</div>
                <div style={styles.alertStatus}>{alert.status}</div>
              </div>
              
              <div style={styles.alertContent}>
                <div style={styles.alertRow}>
                  <span style={styles.alertLabel}>Case ID:</span>
                  <span style={styles.alertValue}>{alert.id}</span>
                </div>
                <div style={styles.alertRow}>
                  <span style={styles.alertLabel}>From Account:</span>
                  <span style={styles.alertValue}>{alert.from}</span>
                </div>
                <div style={styles.alertRow}>
                  <span style={styles.alertLabel}>To Account:</span>
                  <span style={styles.alertValue}>{alert.to}</span>
                </div>
                <div style={styles.alertRow}>
                  <span style={styles.alertLabel}>Amount:</span>
                  <span style={styles.alertAmount}>{alert.amount}</span>
                </div>
              </div>
              
              <button 
                onClick={() => handleFreeze(alert.id)} 
                style={styles.freezeButton}
              >
                Freeze Funds
              </button>
            </div>
          ))}
        </div>
      )}
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
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  emptyText: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#111827',
    margin: '0 0 8px 0',
  },
  emptySubtext: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0,
  },
  alertsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  alertCard: {
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '12px',
    padding: '24px',
    transition: 'all 0.2s',
  },
  alertHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  alertBadge: {
    padding: '6px 12px',
    background: '#dc2626',
    color: '#ffffff',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
  },
  alertStatus: {
    padding: '6px 12px',
    background: '#f3f4f6',
    color: '#374151',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '500',
  },
  alertContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '20px',
  },
  alertRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '14px',
  },
  alertLabel: {
    color: '#6b7280',
    fontWeight: '500',
  },
  alertValue: {
    color: '#111827',
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  alertAmount: {
    color: '#dc2626',
    fontWeight: '700',
    fontSize: '16px',
  },
  freezeButton: {
    width: '100%',
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

export default LeaDashboard;
