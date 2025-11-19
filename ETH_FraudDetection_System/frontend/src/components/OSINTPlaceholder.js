import React from 'react';

const OSINTPlaceholder = () => {
  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.icon}>🔍</div>
        <h1 style={styles.title}>OSINT Module Coming Soon</h1>
        <p style={styles.description}>
          The OSINT (Open Source Intelligence) module is currently under development.
          This feature will provide advanced intelligence gathering capabilities.
        </p>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: 'calc(100vh - 73px)',
    background: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
  },
  content: {
    textAlign: 'center',
    maxWidth: '500px'
  },
  icon: {
    fontSize: '64px',
    marginBottom: '24px'
  },
  title: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#111827',
    margin: '0 0 16px 0',
    letterSpacing: '-0.02em'
  },
  description: {
    fontSize: '16px',
    color: '#6b7280',
    lineHeight: '1.6',
    margin: 0
  }
};

export default OSINTPlaceholder;

