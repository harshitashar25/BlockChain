# 🔍 Transaction Trail System - Like Arkham Intel

## Overview

Your blockchain monitoring system now includes a **Transaction Trail** feature similar to Arkham Intel. This allows you to:

- ✅ Track fund flows between addresses
- ✅ Visualize transaction paths
- ✅ Find connections between wallets
- ✅ Analyze transaction patterns
- ✅ Build transaction graphs

## 🎯 Features

### 1. **Transaction Trail**
Build a trail showing how funds flow from one address through multiple hops.

### 2. **Address Statistics**
Get detailed stats for any address:
- Incoming/outgoing transaction counts
- Total value received/sent
- Unique connections
- First/last seen timestamps

### 3. **Path Finding**
Find the shortest path between two addresses showing how funds moved.

### 4. **Graph Visualization**
Get graph data for visualizing transaction networks.

### 5. **Connected Addresses**
Find all addresses connected to a given address within N hops.

## 📡 API Endpoints

### Get Transaction Trail
**GET** `/api/trail/:address?hops=5&direction=both`

```bash
# Get trail for an address (5 hops, both directions)
curl http://localhost:5000/api/trail/0xd8da6bf26964af9d7eed9e03e53415d37aa96045?hops=5&direction=both

# Get only outgoing transactions
curl http://localhost:5000/api/trail/0xd8da6bf26964af9d7eed9e03e53415d37aa96045?hops=3&direction=outgoing

# Get only incoming transactions
curl http://localhost:5000/api/trail/0xd8da6bf26964af9d7eed9e03e53415d37aa96045?hops=3&direction=incoming
```

**Response:**
```json
{
  "startAddress": "0xd8da...",
  "paths": [
    [
      {
        "from": "0xd8da...",
        "to": "0x742d...",
        "hash": "0x...",
        "value": "2.5",
        "timestamp": "2025-11-18T...",
        "blockNumber": 23828160,
        "direction": "outgoing"
      },
      {
        "from": "0x742d...",
        "to": "0xabc...",
        "hash": "0x...",
        "value": "1.0",
        "timestamp": "2025-11-18T...",
        "blockNumber": 23828161,
        "direction": "outgoing"
      }
    ]
  ],
  "totalValue": "3.5",
  "transactionCount": 2
}
```

### Get Address Statistics
**GET** `/api/trail/stats/:address`

```bash
curl http://localhost:5000/api/trail/stats/0xd8da6bf26964af9d7eed9e03e53415d37aa96045
```

**Response:**
```json
{
  "address": "0xd8da...",
  "incomingCount": 15,
  "outgoingCount": 23,
  "totalIncoming": "150.5",
  "totalOutgoing": "200.3",
  "uniqueConnections": 12,
  "firstSeen": "2025-11-18T...",
  "lastSeen": "2025-11-18T..."
}
```

### Get Connected Addresses
**GET** `/api/trail/connected/:address?depth=3`

```bash
curl http://localhost:5000/api/trail/connected/0xd8da6bf26964af9d7eed9e03e53415d37aa96045?depth=3
```

**Response:**
```json
{
  "address": "0xd8da...",
  "connected": [
    "0x742d...",
    "0xabc...",
    "0xdef..."
  ],
  "count": 3
}
```

### Get Transaction Flow Between Two Addresses
**GET** `/api/trail/flow?from=0x...&to=0x...`

```bash
curl "http://localhost:5000/api/trail/flow?from=0xd8da6bf26964af9d7eed9e03e53415d37aa96045&to=0x742d35cc6634c0532925a3b844bc9e7595f0beb"
```

**Response:**
```json
{
  "from": "0xd8da...",
  "to": "0x742d...",
  "flows": [
    {
      "hash": "0x...",
      "value": "2.5",
      "timestamp": "2025-11-18T...",
      "blockNumber": 23828160
    }
  ],
  "count": 1
}
```

### Find Path Between Two Addresses
**GET** `/api/trail/path?from=0x...&to=0x...&maxHops=10`

```bash
curl "http://localhost:5000/api/trail/path?from=0xd8da6bf26964af9d7eed9e03e53415d37aa96045&to=0x742d35cc6634c0532925a3b844bc9e7595f0beb&maxHops=10"
```

**Response:**
```json
{
  "found": true,
  "path": [
    {
      "from": "0xd8da...",
      "to": "0x742d...",
      "hash": "0x...",
      "value": "2.5",
      "timestamp": "2025-11-18T...",
      "blockNumber": 23828160
    }
  ]
}
```

### Get Graph Data for Visualization
**GET** `/api/trail/graph?addresses=0x...,0x...&depth=2`

```bash
curl "http://localhost:5000/api/trail/graph?addresses=0xd8da6bf26964af9d7eed9e03e53415d37aa96045,0x742d35cc6634c0532925a3b844bc9e7595f0beb&depth=2"
```

**Response:**
```json
{
  "nodes": [
    {
      "id": "0xd8da...",
      "label": "0xd8da...6045",
      "address": "0xd8da...",
      "incomingCount": 15,
      "outgoingCount": 23,
      "totalIncoming": "150.5",
      "totalOutgoing": "200.3"
    },
    {
      "id": "0x742d...",
      "label": "0x742d...0beb",
      "address": "0x742d...",
      "incomingCount": 5,
      "outgoingCount": 10,
      "totalIncoming": "50.0",
      "totalOutgoing": "75.0"
    }
  ],
  "edges": [
    {
      "from": "0xd8da...",
      "to": "0x742d...",
      "hash": "0x...",
      "value": "2.5",
      "timestamp": "2025-11-18T...",
      "blockNumber": 23828160
    }
  ]
}
```

### Get All Transactions for an Address
**GET** `/api/trail/transactions/:address?limit=100`

```bash
curl http://localhost:5000/api/trail/transactions/0xd8da6bf26964af9d7eed9e03e53415d37aa96045?limit=50
```

## 🧪 Testing the Trail System

### Step 1: Create Some Test Transactions

```powershell
# Create multiple transactions to build a trail
Invoke-WebRequest -Uri http://localhost:5000/api/transactions/test -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"type":"eth","value":"1.0"}' | Select-Object -ExpandProperty Content

Invoke-WebRequest -Uri http://localhost:5000/api/transactions/test -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"type":"eth","value":"2.0"}' | Select-Object -ExpandProperty Content

Invoke-WebRequest -Uri http://localhost:5000/api/transactions/test -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"type":"eth","value":"3.0"}' | Select-Object -ExpandProperty Content
```

### Step 2: Get Transaction Trail

```powershell
# Get trail for tracked address
Invoke-WebRequest -Uri "http://localhost:5000/api/trail/0xd8da6bf26964af9d7eed9e03e53415d37aa96045?hops=5" | Select-Object -ExpandProperty Content
```

### Step 3: Get Address Statistics

```powershell
# Get stats
Invoke-WebRequest -Uri "http://localhost:5000/api/trail/stats/0xd8da6bf26964af9d7eed9e03e53415d37aa96045" | Select-Object -ExpandProperty Content
```

### Step 4: Get Graph Data

```powershell
# Get graph for visualization
Invoke-WebRequest -Uri "http://localhost:5000/api/trail/graph?depth=2" | Select-Object -ExpandProperty Content
```

## 🎨 Frontend Integration

The graph data can be used with visualization libraries like:
- **D3.js** - For interactive network graphs
- **vis.js** - For network visualization
- **Cytoscape.js** - For graph theory visualization
- **React Flow** - For React-based flow diagrams

## 📊 Use Cases

### 1. **Fraud Investigation**
- Track how stolen funds move through multiple addresses
- Find the final destination of funds
- Identify money laundering patterns

### 2. **Portfolio Analysis**
- See where your funds are going
- Track investment flows
- Monitor token movements

### 3. **Compliance**
- Build audit trails
- Track fund sources
- Verify transaction paths

### 4. **Research**
- Analyze wallet behavior
- Study transaction patterns
- Research DeFi protocols

## 🔄 How It Works

1. **Transaction Detection**: When a transaction is detected, it's automatically added to the trail
2. **Graph Building**: The system builds a graph structure showing connections
3. **Path Finding**: Uses BFS (Breadth-First Search) to find paths between addresses
4. **Trail Building**: Constructs multi-hop trails showing fund flows
5. **Statistics**: Calculates metrics for each address

## 🚀 Next Steps

1. **Restart your backend** to load the new trail system
2. **Create test transactions** to build a trail
3. **Query the trail endpoints** to see transaction paths
4. **Build a frontend visualization** using the graph data

Your transaction trail system is now ready! 🎉

