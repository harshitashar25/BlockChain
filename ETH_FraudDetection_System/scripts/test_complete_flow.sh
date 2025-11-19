#!/bin/bash

# Complete Freeze Flow Test Script
# This script demonstrates the complete flow from case submission to freeze activation

API_BASE="http://localhost:4000"
CASE_ID="CASE-FLOW-TEST-$(date +%s)"
UTR="UTR123456789"

echo "🚀 Starting Complete Freeze Flow Test"
echo "======================================"
echo ""

# Step 1: Submit case
echo "📋 Step 1: Submitting fraud case..."
CASE_RESPONSE=$(curl -s -X POST ${API_BASE}/api/fabric/submit-evidence \
  -H "Content-Type: application/json" \
  -d "{
    \"caseId\": \"${CASE_ID}\",
    \"evidenceHash\": \"sha256:test-evidence-$(date +%s)\",
    \"requester\": \"bank:HDFC\"
  }")

echo "✅ Case submitted: ${CASE_ID}"
echo ""

# Step 2: Run automated trace
echo "🔍 Step 2: Running automated trace from UTR..."
echo "   UTR: ${UTR}"
echo ""

TRACE_RESPONSE=$(curl -s -X POST ${API_BASE}/api/automated-trace/utr-with-assets \
  -H "Content-Type: application/json" \
  -d "{
    \"utr\": \"${UTR}\",
    \"chain\": \"eth\",
    \"depth\": 6,
    \"hours\": 168
  }")

# Extract asset references
ASSET_REFS=$(echo "$TRACE_RESPONSE" | jq -r '.asset_refs[]' 2>/dev/null)

if [ -z "$ASSET_REFS" ] || [ "$ASSET_REFS" = "null" ]; then
  echo "⚠️  Warning: No asset references found in trace"
  echo "   Using default asset references for testing..."
  ASSET_REFS="bank:abc123def456
exchange:P2P-ORDER-001
chain:0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
fi

echo "✅ Trace completed"
echo "📊 Asset references found:"
echo "$ASSET_REFS" | while read -r ref; do
  echo "   - $ref"
done
echo ""

# Convert asset refs to JSON array
ASSET_REFS_JSON=$(echo "$ASSET_REFS" | jq -R . | jq -s .)

# Step 3: Request freeze
echo "🔒 Step 3: Requesting freeze with asset references..."
FREEZE_REQUEST=$(curl -s -X POST ${API_BASE}/api/freeze/request \
  -H "Content-Type: application/json" \
  -d "{
    \"caseId\": \"${CASE_ID}\",
    \"evidenceHash\": \"sha256:test-evidence\",
    \"requestedBy\": \"LEA:IndiaCyber\",
    \"severity\": \"high\",
    \"assetRefs\": ${ASSET_REFS_JSON}
  }")

echo "$FREEZE_REQUEST" | jq '.'
echo ""

# Step 4: Check status
echo "📊 Step 4: Checking freeze status..."
STATUS_RESPONSE=$(curl -s ${API_BASE}/api/freeze/status/${CASE_ID})
echo "$STATUS_RESPONSE" | jq '.'
echo ""

# Step 5: Approve freeze (3 times)
echo "✅ Step 5: Approving freeze (3 approvals required)..."
echo ""

echo "   Approval 1: Bank A (HDFC)..."
APPROVE_1=$(curl -s -X POST ${API_BASE}/api/freeze/approve \
  -H "Content-Type: application/json" \
  -d "{
    \"caseId\": \"${CASE_ID}\",
    \"approver\": \"bank:HDFC\"
  }")
echo "$APPROVE_1" | jq '{currentApprovals, requiredApprovals, freeze_activated}'
echo ""

echo "   Approval 2: Bank B (ICICI)..."
APPROVE_2=$(curl -s -X POST ${API_BASE}/api/freeze/approve \
  -H "Content-Type: application/json" \
  -d "{
    \"caseId\": \"${CASE_ID}\",
    \"approver\": \"bank:ICICI\"
  }")
echo "$APPROVE_2" | jq '{currentApprovals, requiredApprovals, freeze_activated}'
echo ""

echo "   Approval 3: LEA (IndiaCyber)..."
APPROVE_3=$(curl -s -X POST ${API_BASE}/api/freeze/approve \
  -H "Content-Type: application/json" \
  -d "{
    \"caseId\": \"${CASE_ID}\",
    \"approver\": \"LEA:IndiaCyber\"
  }")
echo "$APPROVE_3" | jq '{currentApprovals, requiredApprovals, freeze_activated}'
echo ""

# Step 6: Final status
echo "🎯 Step 6: Final freeze status..."
FINAL_STATUS=$(curl -s ${API_BASE}/api/freeze/status/${CASE_ID})
echo "$FINAL_STATUS" | jq '.'
echo ""

echo "======================================"
echo "✅ Complete flow test finished!"
echo ""
echo "Case ID: ${CASE_ID}"
echo "Check LEA Dashboard to see the case with asset references"
echo ""

