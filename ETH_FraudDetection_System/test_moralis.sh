#!/bin/bash

# Test Moralis API integration

echo "🧪 Testing Moralis API Integration"
echo "=================================="
echo ""

# Test health endpoint
echo "1. Checking Moralis health..."
curl -s http://localhost:4000/api/moralis/health | python3 -m json.tool
echo ""

# Test fetching transfers for a known wallet
echo "2. Testing fetch for wallet: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
echo "   (This will use real Moralis API if key is set)"
echo ""
curl -s "http://localhost:4000/api/moralis/address/0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb/transfers?chain=eth&limit=5" | python3 -m json.tool | head -30
echo ""

# Test fetch and ingest
echo "3. Testing fetch-and-ingest endpoint..."
curl -s -X POST http://localhost:4000/api/moralis/fetch-and-ingest \
  -H "Content-Type: application/json" \
  -d '{
    "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "chain": "eth",
    "limit": 10
  }' | python3 -m json.tool
echo ""

echo "✅ Test complete!"
echo ""
echo "💡 If you see 'hasApiKey: true' and real transfer data, Moralis is working!"

