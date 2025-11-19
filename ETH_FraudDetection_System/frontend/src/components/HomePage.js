import React, { useState } from 'react';

const HomePage = ({ onNavigate }) => {
  const [hoveredCard, setHoveredCard] = useState(null);

  const navigateToWallet = () => {
    if (onNavigate) onNavigate('wallet-intelligence');
  };

  const navigateToBank = () => {
    if (onNavigate) onNavigate('bank-monitoring');
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.logoSection}>
            <div style={styles.logoIcon}>🔍</div>
            <div>
              <h1 style={styles.title}>Blockchain-Enabled Financial Fraud Traceability System</h1>
              <p style={styles.subtitle}>Real-time cross-institution fraud detection and fund tracing</p>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section style={styles.hero}>
        <div style={styles.heroContent}>
          <div style={styles.heroText}>
            <h2 style={styles.heroTitle}>Combat Financial Fraud with Blockchain Intelligence</h2>
            <p style={styles.heroDescription}>
              A permissioned blockchain-powered system that traces fraudulent financial transactions 
              across banks and wallets in real time and automatically freezes funds if flagged.
            </p>
          </div>
        </div>
      </section>

      {/* Problem Statement Section */}
      <section style={styles.section}>
        <div style={styles.sectionContent}>
          <div style={styles.problemCard}>
            <div style={styles.iconWrapper}>
              <div style={styles.icon}>✓</div>
            </div>
            <div style={styles.cardContent}>
              <h3 style={styles.cardTitle}>Problem Statement</h3>
              <p style={styles.cardText}>
                Create a permissioned blockchain-powered system that traces fraudulent financial 
                transactions across banks and wallets in real time and automatically freezes funds if flagged.
              </p>
            </div>
          </div>

          <div style={styles.problemCard}>
            <div style={{...styles.iconWrapper, background: '#fee2e2'}}>
              <div style={{...styles.icon, color: '#dc2626'}}>✓</div>
            </div>
            <div style={styles.cardContent}>
              <h3 style={styles.cardTitle}>Why India Needs This</h3>
              <p style={styles.cardText}>
                Cybercriminals often move stolen funds across multiple accounts and wallets within minutes. 
                A blockchain-based shared ledger can provide instant cross-institution visibility.
              </p>
            </div>
          </div>

          <div style={styles.problemCard}>
            <div style={{...styles.iconWrapper, background: '#fef3c7'}}>
              <div style={{...styles.icon, color: '#d97706'}}>✓</div>
            </div>
            <div style={styles.cardContent}>
              <h3 style={styles.cardTitle}>Expected Output</h3>
              <p style={styles.cardText}>
                A cross-bank fraud-trail dashboard mapping illicit fund flow and triggering 
                smart alerts for enforcement authorities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section style={styles.featuresSection}>
        <div style={styles.featuresContent}>
          <h2 style={styles.sectionTitle}>System Capabilities</h2>
          <div style={styles.featuresGrid}>
            <div 
              style={{
                ...styles.featureCard,
                ...(hoveredCard === 'wallet' ? styles.featureCardHover : {})
              }}
              onClick={navigateToWallet}
              onMouseEnter={() => setHoveredCard('wallet')}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div style={styles.featureIcon}>🔗</div>
              <h3 style={styles.featureTitle}>Blockchain Transaction Intelligence</h3>
              <p style={styles.featureDescription}>
                Real-time monitoring and analysis of cryptocurrency wallet transactions, 
                token transfers, and contract interactions across blockchain networks.
              </p>
              <div style={styles.featureLink}>Explore →</div>
            </div>

            <div 
              style={{
                ...styles.featureCard,
                ...(hoveredCard === 'bank' ? styles.featureCardHover : {})
              }}
              onClick={navigateToBank}
              onMouseEnter={() => setHoveredCard('bank')}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div style={styles.featureIcon}>🏦</div>
              <h3 style={styles.featureTitle}>Cross-Bank Fraud Monitoring</h3>
              <p style={styles.featureDescription}>
                Track fraudulent transactions across multiple banking institutions, 
                report fraud cases, and execute automated fund freezing protocols.
              </p>
              <div style={styles.featureLink}>Explore →</div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section style={styles.statsSection}>
        <div style={styles.statsContent}>
          <div style={styles.statItem}>
            <div style={styles.statNumber}>Real-Time</div>
            <div style={styles.statLabel}>Transaction Monitoring</div>
          </div>
          <div style={styles.statItem}>
            <div style={styles.statNumber}>Cross-Institution</div>
            <div style={styles.statLabel}>Visibility</div>
          </div>
          <div style={styles.statItem}>
            <div style={styles.statNumber}>Automated</div>
            <div style={styles.statLabel}>Fund Freezing</div>
          </div>
          <div style={styles.statItem}>
            <div style={styles.statNumber}>Blockchain</div>
            <div style={styles.statLabel}>Immutable Records</div>
          </div>
        </div>
      </section>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: '#ffffff',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  header: {
    borderBottom: '1px solid #e5e7eb',
    background: '#ffffff',
    padding: '24px 0',
  },
  headerContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 32px',
  },
  logoSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  logoIcon: {
    fontSize: '32px',
    width: '48px',
    height: '48px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f3f4f6',
    borderRadius: '12px',
  },
  title: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#111827',
    margin: 0,
    lineHeight: '1.2',
  },
  subtitle: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '4px 0 0 0',
    fontWeight: '400',
  },
  hero: {
    background: 'linear-gradient(135deg, #f9fafb 0%, #ffffff 100%)',
    padding: '80px 0',
    borderBottom: '1px solid #e5e7eb',
  },
  heroContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 32px',
  },
  heroText: {
    maxWidth: '800px',
  },
  heroTitle: {
    fontSize: '48px',
    fontWeight: '700',
    color: '#111827',
    margin: '0 0 24px 0',
    lineHeight: '1.1',
    letterSpacing: '-0.02em',
  },
  heroDescription: {
    fontSize: '20px',
    color: '#4b5563',
    lineHeight: '1.6',
    margin: 0,
    fontWeight: '400',
  },
  section: {
    padding: '80px 0',
    background: '#ffffff',
  },
  sectionContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 32px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  problemCard: {
    display: 'flex',
    gap: '20px',
    padding: '32px',
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '16px',
    transition: 'all 0.2s',
  },
  iconWrapper: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    background: '#dbeafe',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  icon: {
    fontSize: '24px',
    color: '#2563eb',
    fontWeight: '600',
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#111827',
    margin: '0 0 12px 0',
  },
  cardText: {
    fontSize: '16px',
    color: '#4b5563',
    lineHeight: '1.6',
    margin: 0,
  },
  featuresSection: {
    padding: '80px 0',
    background: '#f9fafb',
  },
  featuresContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 32px',
  },
  sectionTitle: {
    fontSize: '36px',
    fontWeight: '700',
    color: '#111827',
    margin: '0 0 48px 0',
    textAlign: 'center',
    letterSpacing: '-0.02em',
  },
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '24px',
  },
  featureCard: {
    padding: '40px',
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '16px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
  },
  featureCardHover: {
    borderColor: '#2563eb',
    boxShadow: '0 4px 12px 0 rgba(37, 99, 235, 0.15)',
    transform: 'translateY(-2px)',
  },
  featureIcon: {
    fontSize: '48px',
    marginBottom: '20px',
  },
  featureTitle: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#111827',
    margin: '0 0 12px 0',
  },
  featureDescription: {
    fontSize: '16px',
    color: '#4b5563',
    lineHeight: '1.6',
    margin: '0 0 20px 0',
  },
  featureLink: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#2563eb',
    cursor: 'pointer',
  },
  statsSection: {
    padding: '60px 0',
    background: '#ffffff',
    borderTop: '1px solid #e5e7eb',
  },
  statsContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 32px',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '40px',
  },
  statItem: {
    textAlign: 'center',
  },
  statNumber: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#111827',
    marginBottom: '8px',
  },
  statLabel: {
    fontSize: '14px',
    color: '#6b7280',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
};

export default HomePage;

