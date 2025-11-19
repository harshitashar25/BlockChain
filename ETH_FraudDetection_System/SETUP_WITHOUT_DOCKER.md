# Setup Without Docker

If you don't have Docker installed or prefer to run services separately, follow this guide.

## Option 1: Install Docker (Recommended)

### macOS
```bash
# Download and install Docker Desktop from:
# https://www.docker.com/products/docker-desktop/

# After installation, verify:
docker --version
docker compose version
```

### Linux
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install docker.io docker-compose-plugin

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Add your user to docker group (optional, to avoid sudo)
sudo usermod -aG docker $USER
# Log out and back in for group change to take effect
```

## Option 2: Run Services Manually (Without Docker)

### Neo4j

1. Download Neo4j Community Edition:
   ```bash
   # macOS
   brew install neo4j
   
   # Or download from: https://neo4j.com/download/
   ```

2. Start Neo4j:
   ```bash
   neo4j start
   ```

3. Access Neo4j Browser: http://localhost:7474
   - Default username: `neo4j`
   - Default password: `neo4j` (change on first login)

4. Update `.env`:
   ```
   NEO4J_URI=bolt://localhost:7687
   NEO4J_USER=neo4j
   NEO4J_PASSWORD=your_password
   ```

### Kafka (Optional - Can Skip for PoC)

For PoC, you can skip Kafka and use the file-based fallback in the consumer.

If you need Kafka:

1. Download Kafka:
   ```bash
   # macOS
   brew install kafka
   
   # Or download from: https://kafka.apache.org/downloads
   ```

2. Start Zookeeper:
   ```bash
   zookeeper-server-start /usr/local/etc/kafka/zookeeper.properties
   ```

3. Start Kafka (in another terminal):
   ```bash
   kafka-server-start /usr/local/etc/kafka/server.properties
   ```

4. Update `.env`:
   ```
   KAFKA_BROKER=localhost:9092
   ```

### MinIO (Optional - Can Skip for PoC)

For PoC, evidence storage can be file-based. If you need MinIO:

1. Download MinIO:
   ```bash
   # macOS
   brew install minio/stable/minio
   
   # Or download from: https://min.io/download
   ```

2. Start MinIO:
   ```bash
   minio server ~/minio-data --console-address ":9001"
   ```

3. Access MinIO Console: http://localhost:9001
   - Default username: `minioadmin`
   - Default password: `minioadmin123`

4. Update `.env`:
   ```
   MINIO_ENDPOINT=localhost:9000
   MINIO_ACCESS_KEY=minioadmin
   MINIO_SECRET_KEY=minioadmin123
   ```

## Minimal Setup (PoC Only)

For quick PoC testing, you only need:

1. **Neo4j** (required for graph database)
2. **Backend** (Node.js)
3. **Mock services** (Bank & Exchange)
4. **Frontend** (React)

Kafka and MinIO can be skipped - the system has fallbacks.

### Quick Start (Minimal)

```bash
# 1. Install Neo4j only
brew install neo4j  # macOS
# Or download from neo4j.com

# 2. Start Neo4j
neo4j start

# 3. Update .env (set NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD)

# 4. Start services
cd backend && npm install && npm start &
cd tools/mock_bank && npm install && npm start &
cd tools/mock_exchange && npm install && npm start &
cd frontend && npm install && npm start

# 5. Run demo
node demo/runner.js
```

## Troubleshooting

### Neo4j Connection Issues

```bash
# Check if Neo4j is running
neo4j status

# Check connection
curl http://localhost:7474

# Reset password if needed
neo4j-admin set-initial-password your_password
```

### Port Conflicts

If ports are already in use:

- **7474** (Neo4j HTTP): Change in `neo4j.conf`
- **7687** (Neo4j Bolt): Change in `neo4j.conf`
- **4000** (Backend): Set `PORT=4001` in `.env`
- **4001** (Mock Bank): Change in `tools/mock_bank/server.js`
- **4002** (Mock Exchange): Change in `tools/mock_exchange/server.js`
- **3000** (Frontend): React will auto-use 3001 if 3000 is busy

### Skip Kafka/MinIO

The system will work without Kafka and MinIO:
- Kafka: Consumer falls back to file-based ingestion
- MinIO: Evidence can be stored locally (update code if needed)

