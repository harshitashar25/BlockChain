import React, { useState, useEffect } from 'react';

const BankB_UI = ({ contract }) => {
  const [statusMessage, setStatusMessage] = useState("All Clear");
  const [statusType, setStatusType] = useState('clear'); // 'clear', 'frozen'

  useEffect(() => {
    if (contract) {
      // Listener for the 'HoldExecuted' event
      const holdExecutedListener = (caseId, toAccount) => {
        // Update the status message upon receiving the event
        const message = `FUNDS for account ${toAccount} (Case: ${caseId}). FROZEN`;
        setStatusMessage(message);
        setStatusType('frozen');
        console.log(`Hold Executed: Case ${caseId}. Account: ${toAccount}`);
      };

      contract.on("HoldExecuted", holdExecutedListener);

      // Cleanup function
      return () => {
        contract.off("HoldExecuted", holdExecutedListener);
      };
    }
  }, [contract]);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Receiving Bank Status Monitor</h2>
        <p style={styles.subtitle}>Real-time account status and fund freezing notifications</p>
      </div>
      
      <div style={styles.statusContainer}>
        <div style={{
          ...styles.statusCard,
          ...(statusType === 'frozen' ? styles.statusCardFrozen : styles.statusCardClear)
        }}>
          <div style={styles.statusIcon}>
            {statusType === 'frozen' ? '🔒' : '✅'}
          </div>
          <div style={styles.statusContent}>
            <div style={styles.statusLabel}>Account Status</div>
            <div style={{
              ...styles.statusMessage,
              ...(statusType === 'frozen' ? styles.statusMessageFrozen : styles.statusMessageClear)
            }}>
              {statusMessage}
            </div>
          </div>
        </div>
        
        {statusType === 'frozen' && (
          <div style={styles.warningBox}>
            <div style={styles.warningIcon}>⚠️</div>
            <div style={styles.warningText}>
              <strong>Funds Frozen</strong>
              <p>This account has been flagged for fraud investigation. All transactions are currently blocked.</p>
            </div>
          </div>
        )}
      </div>
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
  statusContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  statusCard: {
    display: 'flex',
    gap: '20px',
    padding: '24px',
    borderRadius: '12px',
    border: '1px solid',
    transition: 'all 0.2s',
  },
  statusCardClear: {
    background: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  statusCardFrozen: {
    background: '#fef2f2',
    borderColor: '#fecaca',
  },
  statusIcon: {
    fontSize: '48px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  statusLabel: {
    fontSize: '12px',
    fontWeight: '500',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  statusMessage: {
    fontSize: '18px',
    fontWeight: '600',
    lineHeight: '1.4',
  },
  statusMessageClear: {
    color: '#10b981',
  },
  statusMessageFrozen: {
    color: '#dc2626',
  },
  warningBox: {
    display: 'flex',
    gap: '16px',
    padding: '20px',
    background: '#fffbeb',
    border: '1px solid #fde68a',
    borderRadius: '12px',
  },
  warningIcon: {
    fontSize: '24px',
    flexShrink: 0,
  },
  warningText: {
    flex: 1,
    fontSize: '14px',
    color: '#92400e',
    lineHeight: '1.6',
  },
};

export default BankB_UI;
