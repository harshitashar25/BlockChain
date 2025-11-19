# Fix Neo4j Authentication Error

## Quick Fix - Use Browser (Easiest Method)

### Step 1: Open Neo4j Browser
```
http://localhost:7474
```

### Step 2: Login
- **Username:** `neo4j`
- **Password:** Try these in order:
  1. `neo4j` (default)
  2. `fraud-trail-password` (if we set it)
  3. The password you set earlier

### Step 3: If Login Fails - Reset via Browser

If you can't login, you need to reset the database:

```bash
# Stop Neo4j
neo4j stop

# Delete the auth file (this resets authentication)
rm -rf /opt/homebrew/var/neo4j/data/dbms/auth

# Start Neo4j
neo4j start
```

Then:
1. Open http://localhost:7474
2. Login with: `neo4j` / `neo4j`
3. **Set a new password** (remember it!)
4. Update `.env` with that password

### Step 4: Update .env File

After setting password in browser, update `.env`:

```bash
NEO4J_PASSWORD=your_password_here
```

### Step 5: Test Connection

```bash
node demo/test_neo4j_connection.js
```

## Alternative: Reset Database Completely

If browser method doesn't work:

```bash
# Stop Neo4j
neo4j stop

# Remove auth and data (WARNING: This deletes all data!)
rm -rf /opt/homebrew/var/neo4j/data/dbms/auth
rm -rf /opt/homebrew/var/neo4j/data/databases/neo4j

# Start Neo4j (fresh start)
neo4j start
```

Then:
1. Open http://localhost:7474
2. Login: `neo4j` / `neo4j`
3. Set new password
4. Update `.env`

## Recommended Password

For this project, use:
```
NEO4J_PASSWORD=fraud-trail-password
```

This matches the default in the codebase.

## After Fixing

Once password is set correctly:

```bash
# Test connection
node demo/test_neo4j_connection.js

# Seed test data
node demo/seed_test_data.js

# Test tracer
curl "http://localhost:4000/api/tracer/trace?seed=chain:0x742d35cc6634c0532925a3b844bc9e7595f0beb"
```

