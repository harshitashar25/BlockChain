# Tracer Fix - Why "Found 0 paths" and How It's Fixed

## Problem

When tracing from a wallet address, you saw:
```
Fetched 1 transfers from Moralis, ingested 2. Found 0 paths.
```

### Root Causes:

1. **Tracer only showed paths ending at exchanges**: The tracer was designed to only report paths that end at `exchange:` endpoints. But when fetching from Moralis, all actors are `chain:` type (blockchain addresses), so no paths were ever added to results.

2. **Not enough data**: Only fetching 1 transfer isn't enough to form meaningful paths. We need to fetch:
   - Both ERC20 AND native (ETH) transfers
   - Transfers for destination addresses (2 levels deep)
   - More transfers per address (30-100 instead of 20)

3. **Too strict filters**: 
   - Minimum amount: 100 ETH (too high!)
   - Time window: 48 hours (too short!)
   - Only looking for exchange endpoints

## Solutions Implemented

### 1. Tracer Now Shows ALL Paths ✅

**Before**: Only paths ending at `exchange:` were shown
**After**: Shows all discovered paths, including:
- Paths at max depth
- Leaf nodes (addresses with no outgoing transfers)
- All intermediate paths

**Files Changed**:
- `backend/src/tracer/memoryTracer.js`
- `backend/src/tracer/tracer.js`

### 2. Enhanced Moralis Fetching ✅

**Before**: Only fetched ERC20 transfers for the seed address
**After**: 
- Fetches BOTH ERC20 AND native transfers
- Fetches transfers for destination addresses (2 levels deep)
- Fetches up to 30 transfers per address
- Fetches for up to 10 related addresses

**File Changed**: `backend/src/routes/moralisIngest.js`

### 3. More Lenient Parameters ✅

**Before**:
- Minimum amount: 100 ETH
- Time window: 48 hours

**After**:
- Minimum amount: 0.01 ETH (10,000x lower!)
- Time window: 7 days (3.5x longer!)

**Files Changed**:
- `backend/src/routes/moralisIngest.js`
- `frontend/src/components/InvestigatorTrace.js`

### 4. Added Debug Endpoints ✅

New endpoints to inspect the graph:
- `GET /api/graph/debug/stats` - Graph statistics
- `GET /api/graph/debug/actor/:actorId` - Actor details

**File Created**: `backend/src/routes/graphDebug.js`

## How to Use

### Step 1: Restart Backend
```bash
cd backend
npm start
```

### Step 2: Try Tracing Again
1. Open http://localhost:3000
2. Go to "Investigator Trace"
3. Enter a wallet address (e.g., `0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb`)
4. Click "Trace"

### Step 3: Check Graph Stats (if still empty)
```bash
# See what's in the graph
curl http://localhost:4000/api/graph/debug/stats

# See details for a specific address
curl http://localhost:4000/api/graph/debug/actor/chain:0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
```

## Expected Results

After these fixes, you should see:
- ✅ Multiple transfers fetched (not just 1)
- ✅ Paths discovered (even if no exchange endpoints)
- ✅ Complete transfer graph visualization
- ✅ All connected addresses shown

## Troubleshooting

### Still seeing "Found 0 paths"?

1. **Check if data was ingested**:
   ```bash
   curl http://localhost:4000/api/graph/debug/stats
   ```
   Should show `total_actors > 0` and `total_relationships > 0`

2. **Check if seed address exists**:
   ```bash
   curl http://localhost:4000/api/graph/debug/actor/chain:0xYOUR_ADDRESS
   ```

3. **Try a different address**: Some addresses might have very few transfers. Try:
   - `0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045` (Vitalik's wallet - lots of activity)
   - `0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb` (from your dataset)

4. **Check backend logs**: Look for:
   - `✅ Fetched X transfers from Moralis`
   - `✅ Ingested X total transfers`
   - `🔍 Tracing with params:`

### Still only fetching 1 transfer?

- The address might genuinely have only 1 transfer
- Try fetching for destination addresses (the system now does this automatically)
- Check Moralis API limits (free tier has rate limits)

## Technical Details

### Path Finding Algorithm

The tracer uses **Priority-BFS** (Breadth-First Search with priority queue):
1. Starts from seed address
2. Explores outgoing transfers
3. Prioritizes by: `risk_score * amount`
4. Stops at max depth or when no more transfers found
5. **Now saves all paths**, not just exchange endpoints

### Graph Structure

```
chain:0xABC... (seed)
  └─> SENT → chain:0xDEF... (destination)
        └─> SENT → chain:0xGHI... (destination's destination)
              └─> ... (continues up to depth limit)
```

All these paths are now shown in the visualization!
