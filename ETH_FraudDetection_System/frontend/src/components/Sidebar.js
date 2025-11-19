import React from 'react';

const Sidebar = ({ activeView, onNavigate }) => {
  const navItems = [
    {
      id: 'wallet-intelligence',
      label: 'Blockchain Transaction Intelligence',
      icon: '🔗'
    },
    {
      id: 'bank-monitoring',
      label: 'Cross-Bank Fraud Monitoring',
      icon: '🏦'
    },
    {
      id: 'osint',
      label: 'OSINT',
      icon: '🔍'
    }
  ];

  return (
    <div style={styles.sidebar} className="sidebar-responsive">
      {/* Logo/Header Section */}
      <div style={styles.sidebarHeader}>
        <div style={styles.logoSection}>
          <div style={styles.logoIcon}>🔍</div>
          <div style={styles.logoText}>
            <div style={styles.logoTitle}>Fraud Traceability</div>
            <div style={styles.logoSubtitle}>System</div>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <nav style={styles.nav}>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            style={{
              ...styles.navItem,
              ...(activeView === item.id ? styles.navItemActive : {})
            }}
          >
            <span style={styles.navIcon}>{item.icon}</span>
            <span style={styles.navLabel} className="nav-label-responsive">{item.label}</span>
            {activeView === item.id && (
              <div style={styles.activeIndicator}></div>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
};

const styles = {
  sidebar: {
    position: 'fixed',
    left: 0,
    top: 0,
    width: '280px',
    height: '100vh',
    background: '#ffffff',
    borderRight: '1px solid #e5e7eb',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 1000,
    boxShadow: '2px 0 8px rgba(0, 0, 0, 0.05)'
  },
  sidebarHeader: {
    padding: '24px 20px',
    borderBottom: '1px solid #e5e7eb',
    background: '#ffffff'
  },
  logoSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  logoIcon: {
    fontSize: '28px',
    width: '44px',
    height: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f3f4f6',
    borderRadius: '10px'
  },
  logoText: {
    display: 'flex',
    flexDirection: 'column'
  },
  logoTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#111827',
    lineHeight: '1.2'
  },
  logoSubtitle: {
    fontSize: '12px',
    color: '#6b7280',
    fontWeight: '400'
  },
  nav: {
    flex: 1,
    padding: '16px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    overflowY: 'auto'
  },
  navItem: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 16px',
    background: 'transparent',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    textAlign: 'left',
    width: '100%',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: '14px',
    fontWeight: '500',
    color: '#4b5563'
  },
  navItemActive: {
    background: '#eff6ff',
    color: '#2563eb',
    fontWeight: '600'
  },
  navIcon: {
    fontSize: '20px',
    width: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  navLabel: {
    flex: 1,
    lineHeight: '1.4'
  },
  activeIndicator: {
    position: 'absolute',
    left: 0,
    top: '50%',
    transform: 'translateY(-50%)',
    width: '4px',
    height: '24px',
    background: '#2563eb',
    borderRadius: '0 4px 4px 0'
  }
};

export default Sidebar;

