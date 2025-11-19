# Neo4j Password Fix

## Problem
Neo4j authentication is failing. This usually happens when:
1. Neo4j password was changed on first login
2. Too many failed login attempts (temporary lockout)

## Solution

### Option 1: Reset Password via Browser (Easiest)

1. **Open Neo4j Browser:**
   ```
   http://localhost:7474
   ```

2. **Login:**
   - Username: `neo4j`
   - Password: Try `neo4j` first, or the password you set

3. **If you forgot the password, reset it:**
   ```bash
   # Stop Neo4j
   neo4j stop
   
   # Reset password (replace 'newpassword' with your desired password)
   neo4j-admin set-initial-password newpassword
   
   # Start Neo4j
   neo4j start
   ```

4. **Update .env:**
   ```bash
   # Edit .env file
   NEO4J_PASSWORD=your_new_password
   ```

### Option 2: Wait and Retry

If you got locked out, wait 1-2 minutes and try again:

```bash
# Wait a minute, then test connection
node demo/test_neo4j_connection.js
```

### Option 3: Use Default Password

If this is a fresh Neo4j installation:

```bash
# In .env file, set:
NEO4J_PASSWORD=neo4j

# Then try seeding again
node demo/seed_test_data.js
```

## Quick Fix Steps

1. **Check Neo4j is running:**
   ```bash
   neo4j status
   ```

2. **Open Neo4j Browser and set password:**
   - Go to: http://localhost:7474
   - Login with: `neo4j` / `neo4j`
   - If prompted, set a new password

3. **Update .env with the password you set**

4. **Test connection:**
   ```bash
   node demo/test_neo4j_connection.js
   ```

5. **Seed data:**
   ```bash
   node demo/seed_test_data.js
   ```

## After Fixing Password

Once password is set correctly, you can:

```bash
# Seed test data
node demo/seed_test_data.js

# Test tracer
curl "http://localhost:4000/api/tracer/trace?seed=chain:0x742d35cc6634c0532925a3b844bc9e7595f0beb&depth=6&hours=48"
```

