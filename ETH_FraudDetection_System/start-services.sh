#!/bin/bash

# Start all services without Docker
# Run this script to start all components

echo "🚀 Starting Fraud Trail System (without Docker)"
echo "================================================"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating from template...${NC}"
    cat > .env << 'EOF'
# Neo4j Configuration
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=neo4j

# Server Configuration
PORT=4000
NODE_ENV=development

# Bank Adapter Mock
MOCK_BANK_URL=http://localhost:4001
MOCK_BANK_API_KEY=mock_bank_key

# Exchange Adapter Mock
MOCK_EXCHANGE_URL=http://localhost:4002
MOCK_EXCHANGE_API_KEY=mock_exchange_key
EOF
    echo -e "${GREEN}✅ .env file created${NC}"
fi

# Check Neo4j
echo -e "\n${YELLOW}📊 Checking Neo4j...${NC}"
if ! neo4j status | grep -q "running"; then
    echo "Starting Neo4j..."
    neo4j start
    sleep 5
else
    echo -e "${GREEN}✅ Neo4j is already running${NC}"
fi

# Start Backend
echo -e "\n${YELLOW}🔧 Starting Backend (port 4000)...${NC}"
cd backend
if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    npm install
fi
npm start &
BACKEND_PID=$!
cd ..
echo -e "${GREEN}✅ Backend started (PID: $BACKEND_PID)${NC}"

# Wait for backend to be ready
sleep 3

# Start Mock Bank
echo -e "\n${YELLOW}🏦 Starting Mock Bank (port 4001)...${NC}"
cd tools/mock_bank
if [ ! -d "node_modules" ]; then
    echo "Installing mock bank dependencies..."
    npm install
fi
npm start &
BANK_PID=$!
cd ../..
echo -e "${GREEN}✅ Mock Bank started (PID: $BANK_PID)${NC}"

# Wait a bit
sleep 2

# Start Mock Exchange
echo -e "\n${YELLOW}💱 Starting Mock Exchange (port 4002)...${NC}"
cd tools/mock_exchange
if [ ! -d "node_modules" ]; then
    echo "Installing mock exchange dependencies..."
    npm install
fi
npm start &
EXCHANGE_PID=$!
cd ../..
echo -e "${GREEN}✅ Mock Exchange started (PID: $EXCHANGE_PID)${NC}"

# Wait a bit
sleep 2

# Start Frontend
echo -e "\n${YELLOW}🎨 Starting Frontend (port 3000)...${NC}"
cd frontend
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi
npm start &
FRONTEND_PID=$!
cd ..
echo -e "${GREEN}✅ Frontend started (PID: $FRONTEND_PID)${NC}"

echo -e "\n${GREEN}================================================"
echo "✅ All services started!"
echo "================================================${NC}"
echo ""
echo "Services:"
echo "  📊 Neo4j Browser:    http://localhost:7474"
echo "  🔧 Backend API:      http://localhost:4000"
echo "  🏦 Mock Bank:        http://localhost:4001"
echo "  💱 Mock Exchange:    http://localhost:4002"
echo "  🎨 Frontend UI:       http://localhost:3000"
echo ""
echo "Process IDs:"
echo "  Backend:   $BACKEND_PID"
echo "  Mock Bank: $BANK_PID"
echo "  Exchange:  $EXCHANGE_PID"
echo "  Frontend:  $FRONTEND_PID"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
echo ""

# Save PIDs to file for cleanup
echo "$BACKEND_PID $BANK_PID $EXCHANGE_PID $FRONTEND_PID" > .service_pids

# Wait for interrupt
trap "echo -e '\n🛑 Stopping services...'; kill $BACKEND_PID $BANK_PID $EXCHANGE_PID $FRONTEND_PID 2>/dev/null; rm -f .service_pids; echo '✅ All services stopped'; exit" INT

# Keep script running
wait

