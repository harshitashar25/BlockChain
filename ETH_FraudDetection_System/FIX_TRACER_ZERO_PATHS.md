# Fix: Tracer Showing 0 Paths

## Problem
The tracer is returning "Found 0 paths to exchange endpoints" even though data was seeded.

## Root Cause
The in-memory graph data was being created in a separate process (seed script) but the backend creates a new empty graph instance on startup.

## Solution Applied

### 1. Shared Graph Instance
Created `sharedMemoryGraph.js` - ensures all parts of the app use the same graph instance.

### 2. Auto-Seed on Startup
Backend now automatically seeds test data when using in-memory graph.

### 3. Manual Seed API
Added `/api/seed/data` endpoint for manual seeding.

## Quick Fix

**Restart the backend** to enable auto-seeding:

```bash
# Stop current backend (Ctrl+C)
# Then restart:
cd backend
npm start
```

You should see:
```
✅ Auto-seeded: 10 actors, 10 relationships
```

Then test the tracer again - it should find paths!

## Manual Seed (Alternative)

If auto-seed doesn't work, seed manually:

```bash
curl -X POST http://localhost:4000/api/seed/data
```

## Verify It's Working

```bash
# Check stats
curl http://localhost:4000/api/seed/stats

# Test tracer
curl "http://localhost:4000/api/tracer/trace?seed=chain:0x742d35cc6634c0532925a3b844bc9e7595f0beb&depth=6&hours=48&minAmt=0.1"
```

You should see `total_paths > 0` and paths to exchange endpoints!

