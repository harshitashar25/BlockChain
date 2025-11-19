import React, { useState, useEffect, useRef } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

function TransactionIntelligence() {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [trailData, setTrailData] = useState(null);
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [timeline, setTimeline] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // overview, graph, timeline
  const graphRef = useRef();

  // Validate Ethereum address
  const isValidEthereumAddress = (addr) => {
    if (!addr) return false;
    const trimmed = addr.trim();
    return trimmed.startsWith('0x') && trimmed.length === 42 && /^[0-9a-fA-F]+$/.test(trimmed.slice(2));
  };

  // Fetch transaction intelligence
  const fetchIntelligence = async () => {
    const trimmedAddress = address.trim();
    
    if (!isValidEthereumAddress(trimmedAddress)) {
      setError('Invalid Ethereum address format');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/intelligence/${trimmedAddress}/trail?chain=eth&depth=3`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        let errorMessage = 'Failed to fetch intelligence data';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
          if (errorData.details) {
            errorMessage += `: ${JSON.stringify(errorData.details)}`;
          }
        } catch (e) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setTrailData(data);
      setStatistics(data.statistics);
      setTimeline(data.timeline || []);

      // Transform graph data for react-force-graph
      const nodes = data.graph.nodes.map(node => ({
        id: node.id,
        label: node.label,
        address: node.address,
        type: node.type,
        chain: node.chain,
        chainName: node.chainName,
        balance: node.balance,
        transactionCount: node.transactionCount || 0
      }));

      const links = data.graph.edges.map(edge => ({
        source: edge.from,
        target: edge.to,
        hash: edge.hash,
        value: edge.value,
        timestamp: edge.timestamp,
        blockNumber: edge.blockNumber,
        type: edge.type,
        chain: edge.chain,
        isBridge: edge.isBridge,
        bridgeType: edge.bridgeType
      }));

      setGraphData({ nodes, links });
    } catch (err) {
      console.error('Error fetching intelligence:', err);
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        setError('Cannot connect to backend server. Please make sure the backend is running on port 5001.');
      } else {
        setError(err.message || 'Failed to fetch transaction intelligence');
      }
    } finally {
      setLoading(false);
    }
  };

  // Format address for display
  const formatAddress = (addr) => {
    if (!addr) return 'N/A';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  // Format value
  const formatValue = (value) => {
    if (!value) return '0';
    const num = parseFloat(value);
    if (num === 0) return '0';
    if (num < 0.0001) return num.toExponential(2);
    return num.toLocaleString(undefined, { maximumFractionDigits: 6 });
  };

  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString();
  };

  // Handle graph node click
  const handleNodeClick = (node) => {
    if (node.address) {
      setAddress(node.address);
      fetchIntelligence();
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <h1 style={styles.title}>Transaction Intelligence</h1>
          <p style={styles.subtitle}>
            Comprehensive blockchain transaction analysis powered by Moralis
          </p>
        </div>
      </div>

      {/* Search Section */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Analyze Wallet Address</h2>
        <div style={styles.searchContainer}>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
            style={{
              ...styles.addressInput,
              borderColor: address && !isValidEthereumAddress(address) 
                ? 'var(--arkham-error)' 
                : 'var(--arkham-border)'
            }}
            onKeyPress={(e) => e.key === 'Enter' && fetchIntelligence()}
          />
          {address && !isValidEthereumAddress(address) && (
            <div style={styles.validationError}>
              ⚠️ Invalid format. Ethereum addresses start with "0x" and are 42 characters.
            </div>
          )}
          <button 
            onClick={fetchIntelligence} 
            style={{
              ...styles.searchButton,
              opacity: (loading || !isValidEthereumAddress(address)) ? 0.5 : 1,
              cursor: (loading || !isValidEthereumAddress(address)) ? 'not-allowed' : 'pointer'
            }}
            disabled={loading || !isValidEthereumAddress(address)}
            onMouseEnter={(e) => {
              if (!loading && isValidEthereumAddress(address)) {
                e.target.style.background = 'var(--arkham-accent-hover)';
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'var(--arkham-accent)';
            }}
          >
            {loading ? 'Analyzing...' : 'Analyze Address'}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div style={styles.errorBox}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Statistics Cards */}
      {statistics && (
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{statistics.totalTransactions}</div>
            <div style={styles.statLabel}>Total Transactions</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{statistics.totalTokenTransfers}</div>
            <div style={styles.statLabel}>Token Transfers</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{statistics.totalNFTTransfers}</div>
            <div style={styles.statLabel}>NFT Transfers</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{statistics.uniqueAddresses}</div>
            <div style={styles.statLabel}>Connected Addresses</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{formatValue(statistics.totalValue)}</div>
            <div style={styles.statLabel}>Total Value (ETH)</div>
          </div>
          {statistics.bridgeTransactions > 0 && (
            <div style={styles.statCard}>
              <div style={styles.statValue}>🌉 {statistics.bridgeTransactions}</div>
              <div style={styles.statLabel}>Bridge Transactions</div>
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      {trailData && (
        <div style={styles.tabContainer}>
          <button
            onClick={() => setActiveTab('overview')}
            style={{
              ...styles.tab,
              ...(activeTab === 'overview' ? styles.tabActive : {})
            }}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('graph')}
            style={{
              ...styles.tab,
              ...(activeTab === 'graph' ? styles.tabActive : {})
            }}
          >
            Transaction Graph
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            style={{
              ...styles.tab,
              ...(activeTab === 'timeline' ? styles.tabActive : {})
            }}
          >
            Timeline
          </button>
        </div>
      )}

      {/* Graph Visualization */}
      {trailData && activeTab === 'graph' && (
        <div style={styles.graphSection}>
          <div style={styles.graphContainer}>
            {graphData.nodes.length > 0 ? (
              <ForceGraph2D
                ref={graphRef}
                graphData={graphData}
                nodeLabel={(node) => `
                  ${node.label}
                  Address: ${node.address}
                  Chain: ${node.chainName || node.chain || 'Unknown'}
                  Transactions: ${node.transactionCount}
                  ${node.balance ? `Balance: ${formatValue(node.balance)} ETH` : ''}
                  ${node.type === 'bridge' ? '🌉 Bridge Contract' : ''}
                `}
                nodeColor={(node) => {
                  if (node.type === 'bridge') return 'var(--arkham-warning)'; // Orange for bridges
                  if (node.address === trailData.address) return 'var(--arkham-accent)'; // Blue for main address
                  return node.transactionCount > 10 ? 'var(--arkham-success)' : 'var(--arkham-text-tertiary)';
                }}
                nodeVal={(node) => {
                  if (node.type === 'bridge') return 15; // Larger nodes for bridges
                  return Math.sqrt(node.transactionCount || 1) * 5;
                }}
                linkLabel={(link) => `
                  ${formatValue(link.value)} ETH
                  Chain: ${link.chain || 'Unknown'}
                  ${link.isBridge ? `🌉 Bridge: ${link.bridgeType || 'Cross-chain'}` : ''}
                  Block: ${link.blockNumber}
                  ${link.timestamp ? `Time: ${formatDate(link.timestamp)}` : ''}
                `}
                linkColor={(link) => {
                  if (link.isBridge) return 'var(--arkham-warning)'; // Orange for bridge transactions
                  return link.type === 'token' ? '#9c27b0' : 'var(--arkham-accent)';
                }}
                linkWidth={(link) => {
                  if (link.isBridge) return 3; // Thicker lines for bridges
                  return Math.sqrt(parseFloat(link.value) || 0) * 2;
                }}
                linkCurvature={(link) => link.isBridge ? 0.3 : 0}
                onNodeClick={handleNodeClick}
                nodeCanvasObject={(node, ctx, globalScale) => {
                  const label = node.label;
                  const fontSize = 12 / globalScale;
                  ctx.font = `${fontSize}px Sans-Serif`;
                  ctx.textAlign = 'center';
                  ctx.textBaseline = 'middle';
                  ctx.fillStyle = 'var(--arkham-text-primary)';
                  ctx.fillText(label, node.x, node.y + 10);
                }}
                cooldownTicks={100}
                onEngineStop={() => graphRef.current?.zoomToFit(400)}
              />
            ) : (
              <div style={styles.emptyState}>No graph data available</div>
            )}
          </div>
        </div>
      )}

      {/* Timeline View */}
      {trailData && activeTab === 'timeline' && (
        <div style={styles.timelineSection}>
          <h2 style={styles.sectionTitle}>Transaction Timeline</h2>
          {timeline.length > 0 ? (
            <div style={styles.timelineContainer}>
              {timeline.map((item, idx) => (
                <div key={idx} style={styles.timelineItem}>
                  <div style={styles.timelineMarker}></div>
                  <div style={styles.timelineContent}>
                    <div style={styles.timelineHeader}>
                      <span style={styles.timelineType}>
                        {item.type === 'token' ? '🪙 Token' : '💎 ETH'} Transfer
                      </span>
                      <span style={styles.timelineTime}>
                        {formatDate(item.timestamp)}
                      </span>
                    </div>
                    <div style={styles.timelineDetails}>
                      <div style={styles.timelineRow}>
                        <span style={styles.timelineLabel}>From:</span>
                        <span style={styles.timelineValue}>
                          {formatAddress(item.from)}
                        </span>
                        <a
                          href={`https://etherscan.io/address/${item.from}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={styles.externalLink}
                        >
                          🔗
                        </a>
                      </div>
                      <div style={styles.timelineRow}>
                        <span style={styles.timelineLabel}>To:</span>
                        <span style={styles.timelineValue}>
                          {formatAddress(item.to)}
                        </span>
                        <a
                          href={`https://etherscan.io/address/${item.to}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={styles.externalLink}
                        >
                          🔗
                        </a>
                      </div>
                      <div style={styles.timelineRow}>
                        <span style={styles.timelineLabel}>Value:</span>
                        <span style={{ ...styles.timelineValue, fontWeight: 'bold', color: '#10b981' }}>
                          {formatValue(item.value)} {item.type === 'token' ? (item.tokenSymbol || 'TOKEN') : 'ETH'}
                        </span>
                      </div>
                      {item.chainName && (
                        <div style={styles.timelineRow}>
                          <span style={styles.timelineLabel}>Chain:</span>
                          <span style={styles.timelineValue}>
                            {item.chainName} {item.isBridge && '🌉'}
                          </span>
                        </div>
                      )}
                      {item.isBridge && (
                        <div style={styles.timelineRow}>
                          <span style={styles.timelineLabel}>Bridge:</span>
                          <span style={{ ...styles.timelineValue, color: '#f59e0b', fontWeight: '600' }}>
                            {item.bridgeType || 'Cross-chain Bridge'}
                          </span>
                        </div>
                      )}
                      <div style={styles.timelineRow}>
                        <span style={styles.timelineLabel}>Block:</span>
                        <span style={styles.timelineValue}>
                          {item.blockNumber?.toLocaleString()}
                        </span>
                        <a
                          href={`https://etherscan.io/tx/${item.hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={styles.txLink}
                        >
                          View Transaction →
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={styles.emptyState}>No timeline data available</div>
          )}
        </div>
      )}

      {/* Overview Tab */}
      {trailData && activeTab === 'overview' && (
        <div style={styles.overviewSection}>
          <h2 style={styles.sectionTitle}>Address Overview</h2>
          <div style={styles.overviewGrid}>
            <div style={styles.overviewCard}>
              <h3 style={styles.overviewCardTitle}>Address Information</h3>
              <div style={styles.overviewRow}>
                <span style={styles.overviewLabel}>Address:</span>
                <span style={styles.overviewValue}>{trailData.address}</span>
              </div>
              <div style={styles.overviewRow}>
                <span style={styles.overviewLabel}>Network:</span>
                <span style={styles.overviewValue}>Ethereum</span>
              </div>
            </div>

            <div style={styles.overviewCard}>
              <h3 style={styles.overviewCardTitle}>Transaction Statistics</h3>
              <div style={styles.overviewRow}>
                <span style={styles.overviewLabel}>Total Transactions:</span>
                <span style={styles.overviewValue}>{statistics.totalTransactions}</span>
              </div>
              <div style={styles.overviewRow}>
                <span style={styles.overviewLabel}>Token Transfers:</span>
                <span style={styles.overviewValue}>{statistics.totalTokenTransfers}</span>
              </div>
              <div style={styles.overviewRow}>
                <span style={styles.overviewLabel}>NFT Transfers:</span>
                <span style={styles.overviewValue}>{statistics.totalNFTTransfers}</span>
              </div>
              <div style={styles.overviewRow}>
                <span style={styles.overviewLabel}>Connected Addresses:</span>
                <span style={styles.overviewValue}>{statistics.uniqueAddresses}</span>
              </div>
            </div>

            <div style={styles.overviewCard}>
              <h3 style={styles.overviewCardTitle}>Graph Information</h3>
              <div style={styles.overviewRow}>
                <span style={styles.overviewLabel}>Nodes:</span>
                <span style={styles.overviewValue}>{graphData.nodes.length}</span>
              </div>
              <div style={styles.overviewRow}>
                <span style={styles.overviewLabel}>Connections:</span>
                <span style={styles.overviewValue}>{graphData.links.length}</span>
              </div>
              <div style={styles.overviewRow}>
                <span style={styles.overviewLabel}>Total Value:</span>
                <span style={{ ...styles.overviewValue, fontWeight: 'bold', color: 'var(--arkham-success)' }}>
                  {formatValue(statistics.totalValue)} ETH
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Styles - Arkham Intel Dark Theme
const styles = {
  container: {
    minHeight: '100vh',
    background: 'var(--arkham-bg-primary)',
    color: 'var(--arkham-text-primary)',
    padding: '32px',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    maxWidth: '1600px',
    margin: '0 auto'
  },
  header: {
    marginBottom: '32px',
    paddingBottom: '24px',
    borderBottom: '1px solid var(--arkham-border)'
  },
  headerLeft: {
    flex: 1
  },
  title: {
    margin: 0,
    fontSize: '32px',
    fontWeight: '800',
    color: 'var(--arkham-text-primary)',
    letterSpacing: '-0.03em'
  },
  subtitle: {
    margin: '8px 0 0 0',
    color: 'var(--arkham-text-secondary)',
    fontSize: '14px',
    fontWeight: '400'
  },
  section: {
    background: 'var(--arkham-bg-card)',
    padding: '24px',
    borderRadius: '8px',
    marginBottom: '24px',
    border: '1px solid var(--arkham-border)'
  },
  sectionTitle: {
    margin: '0 0 20px 0',
    fontSize: '18px',
    fontWeight: '600',
    color: 'var(--arkham-text-primary)'
  },
  searchContainer: {
    display: 'flex',
    gap: '12px',
    flexDirection: 'column'
  },
  addressInput: {
    flex: 1,
    padding: '14px 18px',
    fontSize: '14px',
    background: 'var(--arkham-bg-secondary)',
    border: '1px solid var(--arkham-border)',
    borderRadius: '6px',
    color: 'var(--arkham-text-primary)',
    fontFamily: 'monospace',
    transition: 'all 0.2s'
  },
  searchButton: {
    padding: '12px 24px',
    fontSize: '14px',
    background: 'var(--arkham-accent)',
    color: 'var(--arkham-text-primary)',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
    transition: 'all 0.2s',
    alignSelf: 'flex-start'
  },
  searchButtonHover: {
    background: 'var(--arkham-accent-hover)'
  },
  validationError: {
    marginTop: '8px',
    padding: '12px 16px',
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid var(--arkham-error)',
    borderRadius: '6px',
    color: 'var(--arkham-error)',
    fontSize: '13px',
    fontWeight: '500'
  },
  errorBox: {
    padding: '16px',
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid var(--arkham-error)',
    borderRadius: '6px',
    color: 'var(--arkham-error)',
    marginBottom: '24px',
    fontSize: '14px'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '16px',
    marginBottom: '32px'
  },
  statCard: {
    background: 'var(--arkham-bg-card)',
    padding: '20px',
    borderRadius: '8px',
    textAlign: 'center',
    border: '1px solid var(--arkham-border)'
  },
  statValue: {
    fontSize: '28px',
    fontWeight: '700',
    marginBottom: '8px',
    color: 'var(--arkham-text-primary)'
  },
  statLabel: {
    fontSize: '13px',
    color: 'var(--arkham-text-secondary)',
    fontWeight: '500'
  },
  tabContainer: {
    display: 'flex',
    gap: '8px',
    marginBottom: '24px',
    borderBottom: '1px solid var(--arkham-border)'
  },
  tab: {
    padding: '12px 20px',
    fontSize: '14px',
    background: 'transparent',
    color: 'var(--arkham-text-secondary)',
    border: 'none',
    borderBottom: '2px solid transparent',
    cursor: 'pointer',
    fontWeight: '500',
    transition: 'all 0.2s'
  },
  tabActive: {
    color: 'var(--arkham-text-primary)',
    borderBottomColor: 'var(--arkham-accent)'
  },
  graphSection: {
    background: 'var(--arkham-bg-card)',
    padding: '24px',
    borderRadius: '8px',
    marginBottom: '24px',
    border: '1px solid var(--arkham-border)'
  },
  graphContainer: {
    width: '100%',
    height: '600px',
    border: '1px solid var(--arkham-border)',
    borderRadius: '6px',
    background: 'var(--arkham-bg-secondary)'
  },
  timelineSection: {
    background: 'var(--arkham-bg-card)',
    padding: '24px',
    borderRadius: '8px',
    marginBottom: '24px',
    border: '1px solid var(--arkham-border)'
  },
  timelineContainer: {
    maxHeight: '700px',
    overflowY: 'auto',
    padding: '20px 0'
  },
  timelineItem: {
    display: 'flex',
    gap: '20px',
    marginBottom: '24px',
    position: 'relative'
  },
  timelineMarker: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    background: 'var(--arkham-accent)',
    border: '2px solid var(--arkham-bg-card)',
    boxShadow: '0 0 0 2px var(--arkham-accent)',
    flexShrink: 0,
    marginTop: '4px'
  },
  timelineContent: {
    flex: 1,
    background: 'var(--arkham-bg-secondary)',
    padding: '16px',
    borderRadius: '6px',
    border: '1px solid var(--arkham-border)'
  },
  timelineHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px'
  },
  timelineType: {
    fontSize: '13px',
    fontWeight: '600',
    color: 'var(--arkham-accent)'
  },
  timelineTime: {
    fontSize: '12px',
    color: 'var(--arkham-text-secondary)'
  },
  timelineDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  timelineRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '13px'
  },
  timelineLabel: {
    color: 'var(--arkham-text-secondary)',
    minWidth: '60px',
    fontWeight: '500'
  },
  timelineValue: {
    color: 'var(--arkham-text-primary)',
    fontFamily: 'monospace',
    fontWeight: '500',
    fontSize: '13px'
  },
  externalLink: {
    color: 'var(--arkham-accent)',
    textDecoration: 'none',
    fontSize: '13px',
    transition: 'color 0.2s'
  },
  txLink: {
    color: 'var(--arkham-accent)',
    textDecoration: 'none',
    fontSize: '12px',
    fontWeight: '500',
    marginLeft: 'auto'
  },
  overviewSection: {
    background: 'var(--arkham-bg-card)',
    padding: '24px',
    borderRadius: '8px',
    marginBottom: '24px',
    border: '1px solid var(--arkham-border)'
  },
  overviewGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '20px'
  },
  overviewCard: {
    background: 'var(--arkham-bg-secondary)',
    padding: '20px',
    borderRadius: '6px',
    border: '1px solid var(--arkham-border)'
  },
  overviewCardTitle: {
    margin: '0 0 16px 0',
    fontSize: '16px',
    fontWeight: '600',
    color: 'var(--arkham-text-primary)'
  },
  overviewRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 0',
    borderBottom: '1px solid var(--arkham-border)'
  },
  overviewLabel: {
    color: 'var(--arkham-text-secondary)',
    fontSize: '13px',
    fontWeight: '500'
  },
  overviewValue: {
    color: 'var(--arkham-text-primary)',
    fontSize: '13px',
    fontFamily: 'monospace',
    fontWeight: '600'
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 40px',
    color: 'var(--arkham-text-secondary)',
    fontSize: '14px'
  }
};

export default TransactionIntelligence;

