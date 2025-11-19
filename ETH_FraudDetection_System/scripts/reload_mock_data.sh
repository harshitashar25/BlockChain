#!/bin/bash
# Script to reload mock data into running mock services

echo "🔄 Reloading Mock Data..."
echo ""

# Check if services are running
if ! curl -s http://localhost:4001/api/bank/utr/UTR-FREEZE-001 > /dev/null 2>&1; then
    echo "❌ Mock Bank (port 4001) is not running"
    echo "   Start it: cd tools/mock_bank && node server.js"
    exit 1
fi

if ! curl -s http://localhost:4002/api/exchange/lea/query > /dev/null 2>&1; then
    echo "❌ Mock Exchange (port 4002) is not running"
    echo "   Start it: cd tools/mock_exchange && node server.js"
    exit 1
fi

echo "✅ Both mock services are running"
echo ""
echo "⚠️  Note: Mock services load data on startup."
echo "   To reload data, you need to restart the servers:"
echo ""
echo "   1. Stop mock_bank (Ctrl+C in its terminal)"
echo "   2. Stop mock_exchange (Ctrl+C in its terminal)"
echo "   3. Restart both:"
echo "      cd tools/mock_bank && node server.js"
echo "      cd tools/mock_exchange && node server.js"
echo ""
echo "   Or use the load script:"
echo "      node scripts/load_complete_mock_data.js"
echo ""

