#!/bin/bash

# Test script for cross-chain swap transaction trail storage
# This script tests if cross-chain swaps are properly stored in transaction trails

BASE_URL="http://localhost:5000"
echo "🧪 Testing Cross-Chain Swap Transaction Trail Storage"
echo "=================================================="
echo ""

# Generate test wallet addresses
WALLET_A="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb5"
WALLET_B="0x8ba1f109551bD432803012645Hac136c22C3c0d7"
BRIDGE_CONTRACT="0x8484ef722627bf18ca5ae6bcf031c23e6e922b30"  # Polygon Bridge

echo "📝 Test Configuration:"
echo "   Wallet A (Source): $WALLET_A"
echo "   Wallet B (Destination): $WALLET_B"
echo "   Bridge Contract: $BRIDGE_CONTRACT"
echo "   Swap Value: 2.5 ETH"
echo ""

# Step 1: Add wallets to tracking
echo "Step 1: Adding wallets to tracking..."
curl -X POST "$BASE_URL/api/track/address" \
  -H "Content-Type: application/json" \
  -d "{\"address\": \"$WALLET_A\"}" \
  -s | jq '.'
echo ""

curl -X POST "$BASE_URL/api/track/address" \
  -H "Content-Type: application/json" \
  -d "{\"address\": \"$WALLET_B\"}" \
  -s | jq '.'
echo ""

# Step 2: Create cross-chain swap transaction (Wallet A -> Bridge)
echo "Step 2: Creating source chain transaction (Wallet A -> Bridge)..."
SOURCE_TX=$(curl -X POST "$BASE_URL/api/transactions/test" \
  -H "Content-Type: application/json" \
  -d "{
    \"from\": \"$WALLET_A\",
    \"to\": \"$BRIDGE_CONTRACT\",
    \"value\": \"2.5\",
    \"type\": \"eth\"
  }" \
  -s)

echo "$SOURCE_TX" | jq '.'
SOURCE_HASH=$(echo "$SOURCE_TX" | jq -r '.transaction.hash')
echo "   Source Transaction Hash: $SOURCE_HASH"
echo ""

# Step 3: Create destination chain transaction (Bridge -> Wallet B)
echo "Step 3: Creating destination chain transaction (Bridge -> Wallet B)..."
DEST_TX=$(curl -X POST "$BASE_URL/api/transactions/test" \
  -H "Content-Type: application/json" \
  -d "{
    \"from\": \"$BRIDGE_CONTRACT\",
    \"to\": \"$WALLET_B\",
    \"value\": \"2.5\",
    \"type\": \"eth\"
  }" \
  -s)

echo "$DEST_TX" | jq '.'
DEST_HASH=$(echo "$DEST_TX" | jq -r '.transaction.hash')
echo "   Destination Transaction Hash: $DEST_HASH"
echo ""

# Step 4: Verify transactions are stored in trail for Wallet A
echo "Step 4: Verifying Wallet A transaction trail..."
WALLET_A_TRAIL=$(curl -X GET "$BASE_URL/api/trail/$WALLET_A?hops=5" -s)
echo "$WALLET_A_TRAIL" | jq '.'
echo ""

# Step 5: Verify transactions are stored in trail for Wallet B
echo "Step 5: Verifying Wallet B transaction trail..."
WALLET_B_TRAIL=$(curl -X GET "$BASE_URL/api/trail/$WALLET_B?hops=5" -s)
echo "$WALLET_B_TRAIL" | jq '.'
echo ""

# Step 6: Check flow between Wallet A and Wallet B
echo "Step 6: Checking transaction flow between Wallet A and Wallet B..."
FLOW=$(curl -X GET "$BASE_URL/api/trail/flow?from=$WALLET_A&to=$WALLET_B" -s)
echo "$FLOW" | jq '.'
echo ""

# Step 7: Check path between Wallet A and Wallet B
echo "Step 7: Finding path between Wallet A and Wallet B..."
PATH=$(curl -X GET "$BASE_URL/api/trail/path?from=$WALLET_A&to=$WALLET_B&maxHops=10" -s)
echo "$PATH" | jq '.'
echo ""

# Step 8: Get all transactions for Wallet A
echo "Step 8: Getting all transactions for Wallet A..."
WALLET_A_TXS=$(curl -X GET "$BASE_URL/api/trail/transactions/$WALLET_A?limit=10" -s)
echo "$WALLET_A_TXS" | jq '.'
echo ""

# Step 9: Get all transactions for Wallet B
echo "Step 9: Getting all transactions for Wallet B..."
WALLET_B_TXS=$(curl -X GET "$BASE_URL/api/trail/transactions/$WALLET_B?limit=10" -s)
echo "$WALLET_B_TXS" | jq '.'
echo ""

# Step 10: Verify data accuracy
echo "Step 10: Verifying data accuracy..."
echo "   Checking if source transaction exists in Wallet A trail..."
WALLET_A_HAS_SOURCE=$(echo "$WALLET_A_TRAIL" | jq -r ".paths[] | select(.hash == \"$SOURCE_HASH\") | .hash" | head -1)
if [ "$WALLET_A_HAS_SOURCE" == "$SOURCE_HASH" ]; then
  echo "   ✅ Source transaction found in Wallet A trail"
else
  echo "   ❌ Source transaction NOT found in Wallet A trail"
fi

echo "   Checking if destination transaction exists in Wallet B trail..."
WALLET_B_HAS_DEST=$(echo "$WALLET_B_TRAIL" | jq -r ".paths[] | select(.hash == \"$DEST_HASH\") | .hash" | head -1)
if [ "$WALLET_B_HAS_DEST" == "$DEST_HASH" ]; then
  echo "   ✅ Destination transaction found in Wallet B trail"
else
  echo "   ❌ Destination transaction NOT found in Wallet B trail"
fi

echo "   Checking transaction values..."
SOURCE_VALUE=$(echo "$SOURCE_TX" | jq -r '.transaction.valueEth')
DEST_VALUE=$(echo "$DEST_TX" | jq -r '.transaction.valueEth')
echo "   Source value: $SOURCE_VALUE ETH"
echo "   Destination value: $DEST_VALUE ETH"
if [ "$SOURCE_VALUE" == "$DEST_VALUE" ]; then
  echo "   ✅ Values match correctly"
else
  echo "   ❌ Values do NOT match"
fi

echo ""
echo "=================================================="
echo "✅ Test Complete!"
echo ""

