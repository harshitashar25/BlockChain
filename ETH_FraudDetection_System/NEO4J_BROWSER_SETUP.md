# Neo4j Browser Setup Guide

## Step-by-Step Setup in Browser

### Step 1: Start Neo4j

```bash
neo4j start
```

Wait 10-15 seconds for Neo4j to fully start.

### Step 2: Open Neo4j Browser

Open your web browser and go to:
```
http://localhost:7474
```

### Step 3: First-Time Login

**If this is your first time:**

1. **Initial Login:**
   - Username: `neo4j`
   - Password: `neo4j` (default)

2. **Change Password:**
   - Neo4j will prompt you to change the password
   - Enter a new password (remember this!)
   - Confirm the new password

3. **Save Password:**
   - You can check "Save password" if you want
   - Click "Connect"

### Step 4: Update .env File

After setting your password, update the `.env` file:

```bash
# Edit .env file
NEO4J_PASSWORD=your_new_password_here
```

### Step 5: Verify Connection

In Neo4j Browser, you should see the Neo4j interface. Try running a test query:

```cypher
RETURN "Hello, Neo4j!" as message
```

Click the play button (▶) to execute.

### Step 6: Seed Test Data

Once connected, seed the test data for the fraud detection system:

```bash
node demo/seed_test_data.js
```

This will create:
- Actor nodes (bank accounts, wallets, exchanges)
- SENT relationships (transfers)
- IDENTITY relationships (bank → exchange → wallet)

### Step 7: View the Graph

In Neo4j Browser, run:

```cypher
MATCH (n) RETURN n LIMIT 25
```

This shows all nodes and relationships in the graph.

## Common Queries

### View All Actors
```cypher
MATCH (a:Actor) RETURN a LIMIT 50
```

### View All Transfers
```cypher
MATCH (a:Actor)-[r:SENT]->(b:Actor) 
RETURN a, r, b 
LIMIT 25
```

### Find Exchange Endpoints
```cypher
MATCH (a:Actor) 
WHERE a.id STARTS WITH 'exchange:' 
RETURN a
```

### View Identity Stitching
```cypher
MATCH (a:Actor)-[r:IDENTITY]-(b:Actor) 
RETURN a, r, b
```

## Troubleshooting

### Can't Access Browser

1. **Check Neo4j is running:**
   ```bash
   neo4j status
   ```

2. **Check port 7474:**
   ```bash
   lsof -i :7474
   ```

3. **Restart Neo4j:**
   ```bash
   neo4j restart
   ```

### Forgot Password

Reset the password:

```bash
# Stop Neo4j
neo4j stop

# Reset password
neo4j-admin set-initial-password your_new_password

# Start Neo4j
neo4j start
```

### Connection Refused

If you see "Connection refused":
- Wait 10-15 seconds after starting Neo4j
- Check firewall settings
- Verify Neo4j is actually running: `neo4j status`

## Next Steps

After Neo4j is set up:

1. ✅ Neo4j Browser accessible at http://localhost:7474
2. ✅ Password set and saved in `.env`
3. ✅ Test data seeded: `node demo/seed_test_data.js`
4. ✅ Backend can connect: Test with `node demo/test_neo4j_connection.js`
5. ✅ Tracer works: Test in frontend or via API

## Quick Reference

- **Browser URL:** http://localhost:7474
- **Default Username:** `neo4j`
- **Default Password (first time):** `neo4j`
- **Bolt URI:** `bolt://localhost:7687`
- **HTTP Port:** 7474
- **Bolt Port:** 7687

