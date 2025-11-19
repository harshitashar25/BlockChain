import React from 'react';

const Sidebar = ({ activeView, onNavigate }) => {
  const overviewItems = [
    {
      id: 'home',
      label: 'Home',
      icon: '🏠'
    },
    {
      id: 'wallet-intelligence',
      label: 'Transaction Intelligence',
      icon: '🔗'
    },
    {
      id: 'bank-monitoring',
      label: 'Fraud Monitoring',
      icon: '🏦'
    }
  ];

  const actionsItems = [
    {
      id: 'osint',
      label: 'OSINT Analysis',
      icon: '🔍'
    }
  ];

  return (
    <div style={styles.sidebar} className="sidebar-responsive">
      {/* Logo/Header Section */}
      <div style={styles.sidebarHeader}>
        <div style={styles.logoSection}>
          <div style={styles.logoText}>FRAUDNET</div>
          <div style={styles.logoSubtext}>INTEL</div>
        </div>
      </div>

      {/* Navigation Items */}
      <nav style={styles.nav}>
        {/* OVERVIEW Section */}
        <div style={styles.navSection}>
          <div style={styles.sectionHeader}>OVERVIEW</div>
          {overviewItems.map((item) => (
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
            </button>
          ))}
        </div>

        {/* ACTIONS Section */}
        <div style={styles.navSection}>
          <div style={styles.sectionHeader}>ACTIONS</div>
          {actionsItems.map((item) => (
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
            </button>
          ))}
        </div>
      </nav>

      {/* Collapse Link */}
      <div style={styles.collapseSection}>
        <button 
          style={styles.collapseButton}
          onMouseEnter={(e) => {
            e.target.style.background = 'var(--arkham-bg-hover)';
            e.target.style.color = 'var(--arkham-text-primary)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'transparent';
            e.target.style.color = 'var(--arkham-text-secondary)';
          }}
        >
          <span style={styles.collapseIcon}>◀</span>
          <span style={styles.collapseText}>Collapse</span>
        </button>
      </div>
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
    background: 'var(--arkham-bg-secondary)',
    borderRight: '1px solid var(--arkham-border)',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 1000,
    boxShadow: '2px 0 8px rgba(0, 0, 0, 0.3)'
  },
  sidebarHeader: {
    padding: '20px',
    borderBottom: '1px solid var(--arkham-border)',
    background: 'var(--arkham-bg-secondary)'
  },
  logoSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  logoText: {
    fontSize: '18px',
    fontWeight: '800',
    color: 'var(--arkham-text-primary)',
    letterSpacing: '0.05em',
    lineHeight: '1.2'
  },
  logoSubtext: {
    fontSize: '11px',
    fontWeight: '600',
    color: 'var(--arkham-text-secondary)',
    letterSpacing: '0.1em',
    textTransform: 'uppercase'
  },
  nav: {
    flex: 1,
    padding: '16px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    overflowY: 'auto'
  },
  navSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  sectionHeader: {
    fontSize: '11px',
    fontWeight: '600',
    color: 'var(--arkham-text-tertiary)',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    padding: '8px 16px',
    marginBottom: '4px'
  },
  navItem: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    background: 'transparent',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    textAlign: 'left',
    width: '100%',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: '14px',
    fontWeight: '400',
    color: 'var(--arkham-text-secondary)'
  },
  navItemActive: {
    background: 'var(--arkham-accent)',
    color: 'var(--arkham-text-primary)',
    fontWeight: '600'
  },
  navIcon: {
    fontSize: '18px',
    width: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  navLabel: {
    flex: 1,
    lineHeight: '1.4'
  },
  collapseSection: {
    padding: '16px 20px',
    borderTop: '1px solid var(--arkham-border)',
    background: 'var(--arkham-bg-secondary)'
  },
  collapseButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'transparent',
    border: 'none',
    color: 'var(--arkham-text-secondary)',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '400',
    padding: '8px',
    borderRadius: '6px',
    transition: 'all 0.2s',
    width: '100%'
  },
  collapseButtonHover: {
    background: 'var(--arkham-bg-hover)',
    color: 'var(--arkham-text-primary)'
  },
  collapseIcon: {
    fontSize: '12px'
  },
  collapseText: {
    fontSize: '13px'
  }
};

export default Sidebar;

