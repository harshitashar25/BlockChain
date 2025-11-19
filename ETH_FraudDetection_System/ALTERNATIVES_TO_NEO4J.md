# Alternatives to Neo4j

Since Neo4j is having authentication issues, here are alternatives that work immediately:

## Option 1: In-Memory Graph (Recommended for PoC) ✅

**No installation required!** Works immediately.

### Setup

1. **Update .env:**
   ```bash
   USE_MEMORY_GRAPH=true
   # Comment out or remove Neo4j settings:
   # NEO4J_URI=bolt://localhost:7687
   ```

2. **Restart backend:**
   ```bash
   cd backend
   npm start
   ```

3. **Seed test data:**
   ```bash
   node demo/seed_test_data.js
   ```

That's it! The system will use in-memory graph storage.

### Pros
- ✅ No installation needed
- ✅ Works immediately
- ✅ Perfect for PoC/demos
- ✅ Fast for small datasets

### Cons
- ❌ Data lost on restart
- ❌ Not suitable for production
- ❌ Limited to available RAM

---

## Option 2: ArangoDB (Easy Installation)

Graph database similar to Neo4j, easier to set up.

### Installation

**macOS:**
```bash
brew install arangodb
brew services start arangodb
```

**Linux:**
```bash
# Download from: https://www.arangodb.com/download/
# Or use Docker:
docker run -d -p 8529:8529 -e ARANGO_ROOT_PASSWORD=rootpassword arangodb/arangodb
```

### Setup

1. **Access ArangoDB:**
   - Browser: http://localhost:8529
   - Username: `root`
   - Password: `rootpassword` (or what you set)

2. **Update backend to use ArangoDB:**
   - Would need to create `arangodbClient.js` (similar to neo4jClient.js)
   - Uses AQL (ArangoDB Query Language)

### Pros
- ✅ Easier authentication
- ✅ Good graph capabilities
- ✅ Web UI included
- ✅ Multi-model (document + graph)

---

## Option 3: RedisGraph (If you have Redis)

Graph module for Redis.

### Installation

```bash
# Install Redis
brew install redis

# Install RedisGraph module
# See: https://redisgraph.io/

# Start Redis with RedisGraph
redis-server --loadmodule /path/to/redisgraph.so
```

### Pros
- ✅ Fast (in-memory)
- ✅ Good for real-time queries
- ✅ Simple if you already use Redis

---

## Option 4: PostgreSQL with Recursive Queries

Use PostgreSQL with recursive CTEs for graph queries.

### Installation

```bash
brew install postgresql
brew services start postgresql
```

### Setup

Would need to create tables:
- `actors` table
- `relationships` table
- Use recursive CTEs for path finding

### Pros
- ✅ Most people have PostgreSQL
- ✅ Reliable and stable
- ✅ Good for production

---

## Option 5: Simple JSON File Storage

For very simple PoC, store graph in JSON file.

### Implementation

Already have this as fallback - just use in-memory graph and save to JSON periodically.

---

## Quick Start: Use In-Memory Graph (Easiest)

**Right now, the easiest solution:**

1. **Edit `.env`:**
   ```bash
   USE_MEMORY_GRAPH=true
   ```

2. **Restart backend:**
   ```bash
   cd backend
   npm start
   ```

3. **Seed data:**
   ```bash
   node demo/seed_test_data.js
   ```

4. **Test tracer:**
   ```bash
   curl "http://localhost:4000/api/tracer/trace?seed=chain:0x742d35cc6634c0532925a3b844bc9e7595f0beb"
   ```

**That's it!** No Neo4j needed.

---

## Comparison

| Solution | Setup Time | Production Ready | Performance |
|----------|------------|------------------|-------------|
| In-Memory | ⚡ Instant | ❌ No | ⚡ Fast (small data) |
| ArangoDB | 🟡 5 min | ✅ Yes | 🟡 Good |
| RedisGraph | 🟡 10 min | ✅ Yes | ⚡ Very Fast |
| PostgreSQL | 🟡 5 min | ✅ Yes | 🟡 Good |
| Neo4j | 🔴 Issues | ✅ Yes | 🟡 Good |

---

## Recommendation

**For PoC/Demo:** Use **In-Memory Graph** (Option 1)
- Set `USE_MEMORY_GRAPH=true` in `.env`
- Works immediately
- No installation needed

**For Production:** Use **ArangoDB** or **PostgreSQL**
- More reliable
- Better for production workloads
- Easier authentication

