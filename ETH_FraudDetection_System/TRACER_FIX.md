# Tracer Fix - How to Fix the 500 Error

## Problem
The tracer endpoint was returning 500 errors because:
1. Neo4j might not have test data
2. Actor might not exist in the graph
3. Query syntax issues with datetime comparison

## Solution

### Step 1: Seed Test Data

Before using the tracer, seed test data into Neo4j:

```bash
# Make sure Neo4j is running
neo4j status

# Seed test data
node demo/seed_test_data.js
```

This will:
- Create actors from synthetic dataset
- Create SENT relationships between wallets
- Stitch identities (bank -> exchange -> wallet)
- Make the graph ready for tracing

### Step 2: Restart Backend

After seeding data, restart the backend:

```bash
cd backend
npm start
```

### Step 3: Test the Tracer

Now test with a known actor:

```bash
# Test with a wallet from the dataset
curl "http://localhost:4000/api/tracer/trace?seed=chain:0x742d35cc6634c0532925a3b844bc9e7595f0beb&depth=6&hours=48&minAmt=0.1"
```

### Step 4: Use in Frontend

The frontend should now work. Try:
- Open http://localhost:3000
- Go to "Investigator Trace"
- Enter: `chain:0x742d35cc6634c0532925a3b844bc9e7595f0beb`
- Click "Trace"

## What Was Fixed

1. **Better Error Handling**: Added connection checks and better error messages
2. **Query Compatibility**: Fixed Neo4j query to handle missing properties
3. **Actor Creation**: Ensures seed actor exists before tracing
4. **Data Seeding Script**: Created `demo/seed_test_data.js` to populate test data

## Available Test Actors

After seeding, you can trace from:
- `chain:0x742d35cc6634c0532925a3b844bc9e7595f0beb` (Alice's wallet)
- `chain:0x8ba1f109551bd432803012645hac136c22c9c` (Bob's wallet)
- `chain:0x1234567890123456789012345678901234567890` (Chen's wallet)
- `exchange:P2P-ORDER-001` (Exchange endpoint)

## Troubleshooting

### "Actor not found"
- Run `node demo/seed_test_data.js` to seed data
- Check Neo4j is running: `neo4j status`

### "Neo4j connection failed"
- Check `.env` has correct Neo4j credentials
- Verify Neo4j is accessible: `curl http://localhost:7474`

### "No paths found"
- This is normal if the graph doesn't have connected paths
- Seed more data or run the full E2E demo first

