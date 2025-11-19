import React, { useState } from 'react';

const HomePage = ({ onNavigate }) => {
  const [hoveredCard, setHoveredCard] = useState(null);

  const navigateToWallet = () => {
    if (onNavigate) onNavigate('wallet-intelligence');
  };

  const navigateToBank = () => {
    if (onNavigate) onNavigate('bank-monitoring');
  };

  const navigateToOSINT = () => {
    if (onNavigate) onNavigate('osint');
  };

  return (
    <div style={styles.container}>
      {/* Hero Section */}
      <section style={styles.hero}>
        <div style={styles.heroContent}>
          <div style={styles.heroText}>
            <h1 style={styles.heroTitle}>Welcome to FraudNet Intel</h1>
            <p style={styles.heroDescription}>
              Track both on-chain and off-chain financial transactions with comprehensive 
              blockchain analytics, cross-institution fraud monitoring, and real-time intelligence.
            </p>
            <div style={styles.heroButtons}>
              <button 
                style={styles.primaryButton}
                onClick={navigateToWallet}
                onMouseEnter={(e) => {
                  e.target.style.background = 'var(--arkham-accent-hover)';
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'var(--arkham-accent)';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                Explore Analytics
              </button>
              <button 
                style={styles.secondaryButton}
                onClick={() => window.open('https://github.com', '_blank')}
                onMouseEnter={(e) => {
                  e.target.style.background = '#eab308';
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'var(--arkham-warning)';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                Documentation
                <span style={styles.externalIcon}>↗</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section style={styles.featuresSection}>
        <div style={styles.featuresContent}>
          <h2 style={styles.sectionTitle}>Platform Capabilities</h2>
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
                Advanced on-chain analytics for cryptocurrency wallets, token transfers, 
                NFT movements, and cross-chain bridge transactions. Real-time monitoring 
                with comprehensive transaction trail visualization.
              </p>
              <div style={styles.featureBadge}>Available</div>
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
                Permissioned blockchain system for tracking fraudulent transactions across 
                multiple banking institutions. Automated fund freezing protocols and 
                real-time cross-institution visibility.
              </p>
              <div style={styles.featureBadge}>Available</div>
            </div>

            <div 
              style={{
                ...styles.featureCard,
                ...(hoveredCard === 'osint' ? styles.featureCardHover : {})
              }}
              onClick={navigateToOSINT}
              onMouseEnter={() => setHoveredCard('osint')}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div style={styles.featureIcon}>🔍</div>
              <h3 style={styles.featureTitle}>OSINT Intelligence</h3>
              <p style={styles.featureDescription}>
                Open Source Intelligence gathering and analysis for comprehensive 
                threat assessment and entity profiling across multiple data sources.
              </p>
              <div style={styles.featureBadgeComingSoon}>COMING SOON</div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section style={styles.keyFeaturesSection}>
        <div style={styles.keyFeaturesContent}>
          <h2 style={styles.sectionTitle}>Key Features</h2>
          <div style={styles.keyFeaturesGrid}>
            <div style={styles.keyFeatureItem}>
              <div style={styles.keyFeatureIcon}>⚡</div>
              <h4 style={styles.keyFeatureTitle}>Real-Time Monitoring</h4>
              <p style={styles.keyFeatureText}>
                Live transaction tracking across blockchain networks with instant alerts
              </p>
            </div>
            <div style={styles.keyFeatureItem}>
              <div style={styles.keyFeatureIcon}>🌉</div>
              <h4 style={styles.keyFeatureTitle}>Cross-Chain Analysis</h4>
              <p style={styles.keyFeatureText}>
                Track value flows across multiple chains and bridge transactions
              </p>
            </div>
            <div style={styles.keyFeatureItem}>
              <div style={styles.keyFeatureIcon}>🔐</div>
              <h4 style={styles.keyFeatureTitle}>Permissioned Access</h4>
              <p style={styles.keyFeatureText}>
                Secure, role-based access control for financial institutions
              </p>
            </div>
            <div style={styles.keyFeatureItem}>
              <div style={styles.keyFeatureIcon}>📊</div>
              <h4 style={styles.keyFeatureTitle}>Advanced Analytics</h4>
              <p style={styles.keyFeatureText}>
                Graph visualization, transaction trails, and pattern detection
              </p>
            </div>
            <div style={styles.keyFeatureItem}>
              <div style={styles.keyFeatureIcon}>🛡️</div>
              <h4 style={styles.keyFeatureTitle}>Automated Responses</h4>
              <p style={styles.keyFeatureText}>
                Smart contract-based fund freezing and fraud prevention
              </p>
            </div>
            <div style={styles.keyFeatureItem}>
              <div style={styles.keyFeatureIcon}>🔗</div>
              <h4 style={styles.keyFeatureTitle}>Multi-Asset Support</h4>
              <p style={styles.keyFeatureText}>
                Track ETH, tokens, NFTs, and cross-chain swaps
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section style={styles.statsSection}>
        <div style={styles.statsContent}>
          <div style={styles.statItem}>
            <div style={styles.statNumber}>24/7</div>
            <div style={styles.statLabel}>Continuous Monitoring</div>
          </div>
          <div style={styles.statItem}>
            <div style={styles.statNumber}>Multi-Chain</div>
            <div style={styles.statLabel}>Network Coverage</div>
          </div>
          <div style={styles.statItem}>
            <div style={styles.statNumber}>Real-Time</div>
            <div style={styles.statLabel}>Transaction Alerts</div>
          </div>
          <div style={styles.statItem}>
            <div style={styles.statNumber}>Immutable</div>
            <div style={styles.statLabel}>Blockchain Records</div>
          </div>
        </div>
      </section>
    </div>
  );
};

// Styles - Dark Theme matching Arkham Intel
const styles = {
  container: {
    minHeight: '100vh',
    background: 'var(--arkham-bg-primary)',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    padding: '0',
  },
  hero: {
    background: 'var(--arkham-bg-primary)',
    padding: '80px 32px',
    borderBottom: '1px solid var(--arkham-border)',
  },
  heroContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    textAlign: 'center',
  },
  heroText: {
    maxWidth: '800px',
    margin: '0 auto',
  },
  heroTitle: {
    fontSize: '48px',
    fontWeight: '800',
    color: 'var(--arkham-text-primary)',
    margin: '0 0 24px 0',
    lineHeight: '1.1',
    letterSpacing: '-0.03em',
  },
  heroDescription: {
    fontSize: '18px',
    color: 'var(--arkham-text-secondary)',
    lineHeight: '1.6',
    margin: '0 0 40px 0',
    fontWeight: '400',
  },
  heroButtons: {
    display: 'flex',
    gap: '16px',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  primaryButton: {
    padding: '14px 32px',
    fontSize: '14px',
    fontWeight: '600',
    background: 'var(--arkham-accent)',
    color: 'var(--arkham-text-primary)',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  secondaryButton: {
    padding: '14px 32px',
    fontSize: '14px',
    fontWeight: '600',
    background: 'var(--arkham-warning)',
    color: 'var(--arkham-text-primary)',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  externalIcon: {
    fontSize: '16px',
    opacity: 0.8,
  },
  featuresSection: {
    padding: '80px 32px',
    background: 'var(--arkham-bg-primary)',
  },
  featuresContent: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  sectionTitle: {
    fontSize: '32px',
    fontWeight: '700',
    color: 'var(--arkham-text-primary)',
    margin: '0 0 48px 0',
    textAlign: 'center',
    letterSpacing: '-0.02em',
  },
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '24px',
  },
  featureCard: {
    padding: '32px',
    background: 'var(--arkham-bg-card)',
    border: '1px solid var(--arkham-border)',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    position: 'relative',
  },
  featureCardHover: {
    borderColor: 'var(--arkham-accent)',
    transform: 'translateY(-4px)',
    boxShadow: '0 8px 24px rgba(59, 130, 246, 0.15)',
  },
  featureIcon: {
    fontSize: '40px',
    marginBottom: '20px',
  },
  featureTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: 'var(--arkham-text-primary)',
    margin: '0 0 12px 0',
  },
  featureDescription: {
    fontSize: '14px',
    color: 'var(--arkham-text-secondary)',
    lineHeight: '1.6',
    margin: '0 0 20px 0',
  },
  featureBadge: {
    display: 'inline-block',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: '600',
    background: 'rgba(16, 185, 129, 0.1)',
    color: 'var(--arkham-success)',
    borderRadius: '4px',
    border: '1px solid rgba(16, 185, 129, 0.2)',
  },
  featureBadgeComingSoon: {
    display: 'inline-block',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: '600',
    background: 'rgba(107, 107, 107, 0.1)',
    color: 'var(--arkham-text-tertiary)',
    borderRadius: '4px',
    border: '1px solid rgba(107, 107, 107, 0.2)',
  },
  keyFeaturesSection: {
    padding: '80px 32px',
    background: 'var(--arkham-bg-secondary)',
    borderTop: '1px solid var(--arkham-border)',
    borderBottom: '1px solid var(--arkham-border)',
  },
  keyFeaturesContent: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  keyFeaturesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '24px',
  },
  keyFeatureItem: {
    padding: '24px',
    background: 'var(--arkham-bg-card)',
    border: '1px solid var(--arkham-border)',
    borderRadius: '8px',
    textAlign: 'center',
  },
  keyFeatureIcon: {
    fontSize: '32px',
    marginBottom: '16px',
  },
  keyFeatureTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: 'var(--arkham-text-primary)',
    margin: '0 0 8px 0',
  },
  keyFeatureText: {
    fontSize: '13px',
    color: 'var(--arkham-text-secondary)',
    lineHeight: '1.5',
    margin: 0,
  },
  statsSection: {
    padding: '60px 32px',
    background: 'var(--arkham-bg-primary)',
  },
  statsContent: {
    maxWidth: '1200px',
    margin: '0 auto',
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
    color: 'var(--arkham-text-primary)',
    marginBottom: '8px',
  },
  statLabel: {
    fontSize: '13px',
    color: 'var(--arkham-text-secondary)',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
};

export default HomePage;
