import React, { useState, useEffect, useRef } from 'react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';
const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:5001';
function BlockchainMonitorDashboard() {
  // State management
  const [trackedAddresses, setTrackedAddresses] = useState([]);
  const [trackedContracts, setTrackedContracts] = useState([]);
  const [activities, setActivities] = useState([]);
  const [newAddress, setNewAddress] = useState('');
  const [currentBlock, setCurrentBlock] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [systemStatus, setSystemStatus] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('all'); // all, eth, token, nft, contract
  const [webhookUrl, setWebhookUrl] = useState('');
  const [showWebhookConfig, setShowWebhookConfig] = useState({});
  
  const wsRef = useRef(null);
  const activitiesEndRef = useRef(null);

  // Scroll to bottom when new activities arrive
  useEffect(() => {
    activitiesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activities]);

  // WebSocket connection
  useEffect(() => {
    const connectWebSocket = () => {
      const ws = new WebSocket(WS_URL);
      
      ws.onopen = () => {
        console.log('✅ Connected to blockchain monitoring server');
        setIsConnected(true);
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'ACTIVITY') {
            // New activity detected
            setActivities(prev => {
              const newActivities = [data.data, ...prev];
              return newActivities.slice(0, 500); // Keep last 500
            });
          } else if (data.type === 'BLOCK') {
            // New block mined
            setCurrentBlock(data.data.blockNumber);
          } else if (data.type === 'CONNECTED') {
            // Initial connection data
            const addresses = Array.isArray(data.data?.trackedAddresses) 
              ? data.data.trackedAddresses 
              : [];
            const contracts = Array.isArray(data.data?.trackedContracts) 
              ? data.data.trackedContracts 
              : [];
            setTrackedAddresses(addresses);
            setTrackedContracts(contracts);
          } else if (data.type === 'BLOCK_UPDATE') {
            setCurrentBlock(data.data.blockNumber);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };
      
      ws.onclose = () => {
        console.log('❌ Disconnected from server, reconnecting...');
        setIsConnected(false);
        // Reconnect after 3 seconds
        setTimeout(connectWebSocket, 3000);
      };
      
      wsRef.current = ws;
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Load initial data
  useEffect(() => {
    loadTrackedAddresses();
    loadSystemStatus();
    loadCurrentBlock();
    loadRecentActivities();
    
    // Refresh status every 30 seconds
    const interval = setInterval(() => {
      loadSystemStatus();
      loadCurrentBlock();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadTrackedAddresses = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/track/addresses`);
      const data = await response.json();
      const addresses = Array.isArray(data.trackedAddresses) 
        ? data.trackedAddresses 
        : [];
      const contracts = Array.isArray(data.trackedContracts) 
        ? data.trackedContracts 
        : [];
      setTrackedAddresses(addresses);
      setTrackedContracts(contracts);
    } catch (error) {
      console.error('Error loading tracked addresses:', error);
      // Ensure arrays are set even on error
      setTrackedAddresses([]);
      setTrackedContracts([]);
    }
  };

  const loadSystemStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/blockchain/status`);
      const data = await response.json();
      setSystemStatus(data);
    } catch (error) {
      console.error('Error loading system status:', error);
    }
  };

  const loadCurrentBlock = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/blockchain/block/current`);
      const data = await response.json();
      setCurrentBlock(data.blockNumber);
    } catch (error) {
      console.error('Error loading current block:', error);
    }
  };

  const loadRecentActivities = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/transactions/activities/all?limit=100`);
      const data = await response.json();
      if (data.activities) {
        setActivities(data.activities);
      }
    } catch (error) {
      console.error('Error loading activities:', error);
    }
  };

  // Validate Ethereum address format
  const isValidEthereumAddress = (address) => {
    if (!address) return false;
    const trimmed = address.trim();
    
    // Must start with 0x
    if (!trimmed.startsWith('0x')) return false;
    
    // Must be exactly 42 characters (0x + 40 hex chars)
    if (trimmed.length !== 42) return false;
    
    // Must contain only hexadecimal characters after 0x
    const hexPart = trimmed.slice(2);
    const hexRegex = /^[0-9a-fA-F]+$/;
    if (!hexRegex.test(hexPart)) return false;
    
    return true;
  };

  const handleAddAddress = async () => {
    const trimmedAddress = newAddress.trim();
    
    if (!trimmedAddress) {
      alert('Please enter an Ethereum address');
      return;
    }

    // Enhanced address validation
    if (!isValidEthereumAddress(trimmedAddress)) {
      alert(
        'Invalid Ethereum address format!\n\n' +
        'Ethereum addresses must:\n' +
        '• Start with "0x"\n' +
        '• Be exactly 42 characters long\n' +
        '• Contain only hexadecimal characters (0-9, a-f, A-F)\n\n' +
        'Example: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb\n\n' +
        'Note: The address you entered looks like a Solana address. ' +
        'This service tracks Ethereum addresses only.'
      );
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/track/address`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: trimmedAddress })
      });
      
      const data = await response.json();
      if (data.success) {
        const addresses = Array.isArray(data.trackedAddresses) 
          ? data.trackedAddresses 
          : [];
        setTrackedAddresses(addresses);
        const addedAddress = trimmedAddress;
        setNewAddress('');
        alert(`✅ Address ${addedAddress.substring(0, 10)}...${addedAddress.substring(addedAddress.length - 8)} added to tracking`);
      } else {
        alert(`Error: ${data.error || 'Failed to add address'}`);
      }
    } catch (error) {
      console.error('Error adding address:', error);
      alert('Failed to add address. Make sure the backend server is running.');
    }
  };

  const handleRemoveAddress = async (address) => {
    if (!window.confirm(`Remove ${address} from tracking?`)) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/track/address/${address}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      if (data.success) {
        const addresses = Array.isArray(data.trackedAddresses) 
          ? data.trackedAddresses 
          : [];
        setTrackedAddresses(addresses);
        alert(`✅ Address removed from tracking`);
      }
    } catch (error) {
      console.error('Error removing address:', error);
      alert('Failed to remove address');
    }
  };

  const handleConfigureWebhook = async (address) => {
    if (!webhookUrl.trim()) {
      alert('Please enter a webhook URL');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/webhooks/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: address,
          webhookUrl: webhookUrl.trim()
        })
      });
      
      const data = await response.json();
      if (data.success) {
        alert(`✅ Webhook configured for ${address}`);
        setWebhookUrl('');
        setShowWebhookConfig({ ...showWebhookConfig, [address]: false });
      } else {
        alert(`Error: ${data.error || 'Failed to configure webhook'}`);
      }
    } catch (error) {
      console.error('Error configuring webhook:', error);
      alert('Failed to configure webhook');
    }
  };

  // Filter activities based on selected filter
  const filteredActivities = activities.filter(activity => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'eth' && activity.type === 'TRANSACTION' && activity.valueEth !== '0') return true;
    if (selectedFilter === 'token' && activity.activities?.some(a => a.type === 'TOKEN_TRANSFER')) return true;
    if (selectedFilter === 'nft' && activity.activities?.some(a => a.type === 'NFT_TRANSFER')) return true;
    if (selectedFilter === 'contract' && activity.activities?.some(a => a.type === 'CONTRACT_INTERACTION')) return true;
    return false;
  });

  // Format address for display
  const formatAddress = (address) => {
    if (!address) return 'N/A';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // Format value
  const formatValue = (value) => {
    if (!value) return '0';
    const num = parseFloat(value);
    if (num === 0) return '0';
    if (num < 0.0001) return num.toExponential(2);
    return num.toLocaleString(undefined, { maximumFractionDigits: 6 });
  };

  // Get activity type badge color
  const getActivityTypeColor = (activity) => {
    if (activity.activities?.some(a => a.type === 'NFT_TRANSFER')) return '#9c27b0';
    if (activity.activities?.some(a => a.type === 'TOKEN_TRANSFER')) return '#2196f3';
    if (activity.activities?.some(a => a.type === 'CONTRACT_INTERACTION')) return '#ff9800';
    if (activity.valueEth && parseFloat(activity.valueEth) > 0) return '#4caf50';
    return '#757575';
  };

  // Get activity type label
  const getActivityTypeLabel = (activity) => {
    if (activity.activities?.some(a => a.type === 'NFT_TRANSFER')) return 'NFT Transfer';
    if (activity.activities?.some(a => a.type === 'TOKEN_TRANSFER')) return 'Token Transfer';
    if (activity.activities?.some(a => a.type === 'CONTRACT_INTERACTION')) return 'Contract Call';
    if (activity.valueEth && parseFloat(activity.valueEth) > 0) return 'ETH Transfer';
    return 'Transaction';
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <h1 style={styles.title}>Blockchain Transaction Intelligence</h1>
          <p style={styles.subtitle}>Real-time cryptocurrency wallet and contract activity monitoring</p>
        </div>
        <div style={styles.headerRight}>
          <div style={styles.statusIndicator}>
            <div style={{
              ...styles.statusDot,
              background: isConnected ? '#10b981' : '#ef4444'
            }}></div>
            <span style={{ color: '#374151', fontWeight: '500' }}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          {currentBlock && (
            <div style={styles.blockInfo}>
              <span style={styles.blockLabel}>Block:</span>
              <span style={styles.blockNumber}>{currentBlock.toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      {systemStatus && (
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{systemStatus.trackedAddresses}</div>
            <div style={styles.statLabel}>Tracked Wallets</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{systemStatus.trackedContracts}</div>
            <div style={styles.statLabel}>Tracked Contracts</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{activities.length}</div>
            <div style={styles.statLabel}>Activities Detected</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{systemStatus.chain || 'ethereum'}</div>
            <div style={styles.statLabel}>Network</div>
          </div>
        </div>
      )}

      {/* Add Address Section */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Add Address to Track</h2>
        <p style={styles.helpText}>
          Enter an Ethereum wallet address (must start with "0x" and be 42 characters long)
        </p>
        <div style={styles.addAddressContainer}>
          <input
            type="text"
            value={newAddress}
            onChange={(e) => setNewAddress(e.target.value)}
            placeholder="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
            style={{
              ...styles.addressInput,
              borderColor: newAddress && !isValidEthereumAddress(newAddress) && newAddress.length > 0 
                ? '#f44336' 
                : '#2d3748'
            }}
            onKeyPress={(e) => e.key === 'Enter' && handleAddAddress()}
          />
          {newAddress && !isValidEthereumAddress(newAddress) && newAddress.length > 0 && (
            <div style={styles.validationError}>
              ⚠️ Invalid format. Ethereum addresses start with "0x" and are 42 characters.
            </div>
          )}
          <button onClick={handleAddAddress} style={styles.addButton}>
            Track Address
          </button>
        </div>
      </div>

      {/* Tracked Addresses */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>
          Tracked Addresses ({Array.isArray(trackedAddresses) ? trackedAddresses.length : 0})
        </h2>
        {!Array.isArray(trackedAddresses) || trackedAddresses.length === 0 ? (
          <p style={styles.emptyMessage}>No addresses being tracked. Add one above to get started!</p>
        ) : (
          <div style={styles.addressGrid}>
            {trackedAddresses.map((address, idx) => (
              <div key={idx} style={styles.addressCard}>
                <div style={styles.addressCardContent}>
                  <div style={styles.addressText}>
                    <span style={styles.addressLabel}>Wallet:</span>
                    <span style={styles.addressValue}>{formatAddress(address)}</span>
                    <a
                      href={`https://etherscan.io/address/${address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={styles.externalLink}
                    >
                      🔗
                    </a>
                  </div>
                  <div style={styles.addressActions}>
                    <button
                      onClick={() => setShowWebhookConfig({ ...showWebhookConfig, [address]: !showWebhookConfig[address] })}
                      style={styles.webhookButton}
                    >
                      {showWebhookConfig[address] ? 'Cancel' : 'Configure Webhook'}
                    </button>
                    <button
                      onClick={() => handleRemoveAddress(address)}
                      style={styles.removeButton}
                    >
                      Remove
                    </button>
                  </div>
                  {showWebhookConfig[address] && (
                    <div style={styles.webhookConfig}>
                      <input
                        type="text"
                        value={webhookUrl}
                        onChange={(e) => setWebhookUrl(e.target.value)}
                        placeholder="https://your-server.com/webhook"
                        style={styles.webhookInput}
                      />
                      <button
                        onClick={() => handleConfigureWebhook(address)}
                        style={styles.saveWebhookButton}
                      >
                        Save
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Activity Feed */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>
            Real-Time Activity Feed ({filteredActivities.length})
          </h2>
          <div style={styles.filterButtons}>
            {['all', 'eth', 'token', 'nft', 'contract'].map(filter => (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter)}
                style={{
                  ...styles.filterButton,
                  ...(selectedFilter === filter ? styles.filterButtonActive : {})
                }}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {filteredActivities.length === 0 ? (
          <div style={styles.emptyMessage}>
            <p>No activities detected yet.</p>
            <p style={{ fontSize: '14px', marginTop: '10px', color: '#666' }}>
              Add a wallet address above and wait for transactions to appear in real-time!
            </p>
          </div>
        ) : (
          <div style={styles.activityFeed}>
            {filteredActivities.map((activity, idx) => (
              <div key={idx} style={styles.activityCard}>
                <div style={styles.activityHeader}>
                  <div style={styles.activityType}>
                    <span style={{
                      ...styles.activityTypeBadge,
                      background: getActivityTypeColor(activity)
                    }}>
                      {getActivityTypeLabel(activity)}
                    </span>
                    <span style={styles.activityTime}>
                      {new Date(activity.blockTimestamp || activity.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <a
                    href={`https://etherscan.io/tx/${activity.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.txLink}
                  >
                    View on Etherscan →
                  </a>
                </div>

                <div style={styles.activityDetails}>
                  <div style={styles.activityRow}>
                    <span style={styles.activityLabel}>From:</span>
                    <span style={styles.activityValue}>
                      {formatAddress(activity.from)}
                      {activity.fromTracked && ' ⭐'}
                    </span>
                  </div>
                  <div style={styles.activityRow}>
                    <span style={styles.activityLabel}>To:</span>
                    <span style={styles.activityValue}>
                      {formatAddress(activity.to)}
                      {activity.toTracked && ' ⭐'}
                    </span>
                  </div>
                  {activity.valueEth && parseFloat(activity.valueEth) > 0 && (
                    <div style={styles.activityRow}>
                      <span style={styles.activityLabel}>Value:</span>
                      <span style={{ ...styles.activityValue, fontWeight: 'bold', color: '#10b981' }}>
                        {formatValue(activity.valueEth)} ETH
                      </span>
                    </div>
                  )}
                  <div style={styles.activityRow}>
                    <span style={styles.activityLabel}>Block:</span>
                    <span style={styles.activityValue}>
                      {activity.blockNumber?.toLocaleString()}
                    </span>
                  </div>
                  <div style={styles.activityRow}>
                    <span style={styles.activityLabel}>Status:</span>
                    <span style={{
                      ...styles.statusBadge,
                      background: activity.status === 'success' ? '#10b981' : '#ef4444'
                    }}>
                      {activity.status || 'pending'}
                    </span>
                  </div>
                </div>

                {/* Sub-activities (tokens, NFTs, etc.) */}
                {activity.activities && activity.activities.length > 0 && (
                  <div style={styles.subActivities}>
                    {activity.activities.map((subActivity, subIdx) => (
                      <div key={subIdx} style={styles.subActivity}>
                        {subActivity.type === 'TOKEN_TRANSFER' && (
                          <div>
                            <span style={styles.subActivityLabel}>Token:</span>
                            <span style={styles.subActivityValue}>
                              {formatValue(subActivity.value)} {subActivity.standard || 'ERC20'}
                            </span>
                            <span style={styles.subActivityContract}>
                              ({formatAddress(subActivity.contract)})
                            </span>
                          </div>
                        )}
                        {subActivity.type === 'NFT_TRANSFER' && (
                          <div>
                            <span style={styles.subActivityLabel}>NFT:</span>
                            <span style={styles.subActivityValue}>
                              Token ID: {subActivity.tokenId} ({subActivity.standard})
                            </span>
                            <span style={styles.subActivityContract}>
                              ({formatAddress(subActivity.contract)})
                            </span>
                          </div>
                        )}
                        {subActivity.type === 'CONTRACT_INTERACTION' && (
                          <div>
                            <span style={styles.subActivityLabel}>Contract Call:</span>
                            <span style={styles.subActivityValue}>
                              {subActivity.functionName || 'Unknown'}
                            </span>
                            <span style={styles.subActivityContract}>
                              ({formatAddress(subActivity.contract)})
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Balance Change */}
                {activity.balanceChange && (
                  <div style={styles.balanceChange}>
                    <span style={styles.balanceLabel}>Balance Change:</span>
                    <span style={{
                      ...styles.balanceValue,
                      color: parseFloat(activity.balanceChange.balanceDelta) >= 0 ? '#10b981' : '#ef4444'
                    }}>
                      {parseFloat(activity.balanceChange.balanceDelta) >= 0 ? '+' : ''}
                      {formatValue(activity.balanceChange.balanceDeltaEth)} ETH
                    </span>
                  </div>
                )}
              </div>
            ))}
            <div ref={activitiesEndRef} />
          </div>
        )}
      </div>
    </div>
  );
}

// Styles - Light Mode (Arkham-inspired)
const styles = {
  container: {
    minHeight: '100vh',
    background: '#ffffff',
    color: '#111827',
    padding: '32px',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    maxWidth: '1400px',
    margin: '0 auto'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px',
    paddingBottom: '24px',
    borderBottom: '1px solid #e5e7eb'
  },
  headerLeft: {
    flex: 1
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px'
  },
  title: {
    margin: 0,
    fontSize: '32px',
    fontWeight: '700',
    color: '#111827',
    letterSpacing: '-0.02em'
  },
  subtitle: {
    margin: '8px 0 0 0',
    color: '#6b7280',
    fontSize: '14px',
    fontWeight: '400'
  },
  statusIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    background: '#f3f4f6',
    borderRadius: '8px',
    border: '1px solid #e5e7eb'
  },
  statusDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    animation: 'pulse 2s infinite'
  },
  blockInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    background: '#f3f4f6',
    borderRadius: '8px',
    border: '1px solid #e5e7eb'
  },
  blockLabel: {
    color: '#6b7280',
    fontSize: '14px',
    fontWeight: '500'
  },
  blockNumber: {
    fontWeight: '600',
    color: '#2563eb'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '32px'
  },
  statCard: {
    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
    padding: '24px',
    borderRadius: '12px',
    textAlign: 'center',
    border: '1px solid #dbeafe'
  },
  statValue: {
    fontSize: '32px',
    fontWeight: '700',
    marginBottom: '8px',
    color: '#ffffff'
  },
  statLabel: {
    fontSize: '14px',
    color: '#ffffff',
    opacity: 0.9,
    fontWeight: '500'
  },
  section: {
    background: '#ffffff',
    padding: '32px',
    borderRadius: '12px',
    marginBottom: '32px',
    border: '1px solid #e5e7eb',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px'
  },
  sectionTitle: {
    margin: 0,
    fontSize: '20px',
    fontWeight: '600',
    color: '#111827'
  },
  addAddressContainer: {
    display: 'flex',
    gap: '12px',
    flexDirection: 'column'
  },
  addressInput: {
    flex: 1,
    padding: '12px 16px',
    fontSize: '14px',
    background: '#ffffff',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    color: '#111827',
    fontFamily: 'monospace',
    transition: 'all 0.2s'
  },
  addButton: {
    padding: '12px 24px',
    fontSize: '14px',
    background: '#2563eb',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    transition: 'all 0.2s',
    alignSelf: 'flex-start'
  },
  addressGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
    gap: '16px'
  },
  addressCard: {
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '20px',
    transition: 'all 0.2s',
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
  },
  addressCardContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  addressText: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontFamily: 'monospace',
    fontSize: '14px'
  },
  addressLabel: {
    color: '#6b7280',
    fontSize: '12px',
    fontWeight: '500'
  },
  addressValue: {
    color: '#111827',
    fontWeight: '600'
  },
  externalLink: {
    color: '#2563eb',
    textDecoration: 'none',
    fontSize: '16px',
    transition: 'color 0.2s'
  },
  addressActions: {
    display: 'flex',
    gap: '10px'
  },
  webhookButton: {
    padding: '8px 16px',
    fontSize: '12px',
    background: '#f3f4f6',
    color: '#374151',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '500',
    transition: 'all 0.2s'
  },
  removeButton: {
    padding: '8px 16px',
    fontSize: '12px',
    background: '#ef4444',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '500',
    transition: 'all 0.2s'
  },
  webhookConfig: {
    display: 'flex',
    gap: '10px',
    marginTop: '12px'
  },
  webhookInput: {
    flex: 1,
    padding: '8px 12px',
    fontSize: '12px',
    background: '#ffffff',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    color: '#111827'
  },
  saveWebhookButton: {
    padding: '8px 16px',
    fontSize: '12px',
    background: '#10b981',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '500'
  },
  filterButtons: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap'
  },
  filterButton: {
    padding: '8px 16px',
    fontSize: '12px',
    background: '#ffffff',
    color: '#6b7280',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontWeight: '500'
  },
  filterButtonActive: {
    background: '#2563eb',
    color: '#ffffff',
    border: '1px solid #2563eb'
  },
  activityFeed: {
    maxHeight: '600px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    paddingRight: '8px'
  },
  activityCard: {
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '20px',
    transition: 'all 0.2s',
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
  },
  activityHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  },
  activityType: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  activityTypeBadge: {
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#ffffff'
  },
  activityTime: {
    fontSize: '12px',
    color: '#6b7280',
    fontWeight: '400'
  },
  txLink: {
    color: '#2563eb',
    textDecoration: 'none',
    fontSize: '12px',
    fontWeight: '500',
    transition: 'color 0.2s'
  },
  activityDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  activityRow: {
    display: 'flex',
    gap: '12px',
    fontSize: '14px',
    alignItems: 'center'
  },
  activityLabel: {
    color: '#6b7280',
    minWidth: '80px',
    fontWeight: '500'
  },
  activityValue: {
    color: '#111827',
    fontFamily: 'monospace',
    fontWeight: '500'
  },
  statusBadge: {
    padding: '4px 10px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '600',
    color: '#ffffff'
  },
  subActivities: {
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid #e5e7eb',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  subActivity: {
    fontSize: '13px',
    color: '#4b5563'
  },
  subActivityLabel: {
    color: '#2563eb',
    fontWeight: '600'
  },
  subActivityValue: {
    color: '#111827',
    marginLeft: '8px',
    fontWeight: '500'
  },
  subActivityContract: {
    color: '#6b7280',
    fontFamily: 'monospace',
    fontSize: '11px',
    marginLeft: '8px'
  },
  balanceChange: {
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid #e5e7eb',
    display: 'flex',
    gap: '12px',
    alignItems: 'center'
  },
  balanceLabel: {
    color: '#6b7280',
    fontSize: '13px',
    fontWeight: '500'
  },
  balanceValue: {
    fontSize: '14px',
    fontWeight: '600'
  },
  emptyMessage: {
    textAlign: 'center',
    padding: '60px 40px',
    color: '#6b7280'
  },
  helpText: {
    fontSize: '13px',
    color: '#6b7280',
    marginBottom: '16px',
    marginTop: '-4px',
    fontWeight: '400'
  },
  validationError: {
    marginTop: '8px',
    padding: '12px 16px',
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    color: '#dc2626',
    fontSize: '13px',
    fontWeight: '500'
  }
};

export default BlockchainMonitorDashboard;

