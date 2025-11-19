# PowerShell script for testing cross-chain swap transaction trail storage
# This script tests if cross-chain swaps are properly stored in transaction trails

$BASE_URL = "http://localhost:5000"
Write-Host "🧪 Testing Cross-Chain Swap Transaction Trail Storage" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Generate test wallet addresses
$WALLET_A = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb5"
$WALLET_B = "0x8ba1f109551bD432803012645Hac136c22C3c0d7"
$BRIDGE_CONTRACT = "0x8484ef722627bf18ca5ae6bcf031c23e6e922b30"  # Polygon Bridge

Write-Host "📝 Test Configuration:" -ForegroundColor Yellow
Write-Host "   Wallet A (Source): $WALLET_A"
Write-Host "   Wallet B (Destination): $WALLET_B"
Write-Host "   Bridge Contract: $BRIDGE_CONTRACT"
Write-Host "   Swap Value: 2.5 ETH"
Write-Host ""

# Step 1: Add wallets to tracking
Write-Host "Step 1: Adding wallets to tracking..." -ForegroundColor Green
$response1 = Invoke-RestMethod -Uri "$BASE_URL/api/track/address" `
    -Method POST `
    -ContentType "application/json" `
    -Body (@{
        address = $WALLET_A
    } | ConvertTo-Json)
$response1 | ConvertTo-Json -Depth 10
Write-Host ""

$response2 = Invoke-RestMethod -Uri "$BASE_URL/api/track/address" `
    -Method POST `
    -ContentType "application/json" `
    -Body (@{
        address = $WALLET_B
    } | ConvertTo-Json)
$response2 | ConvertTo-Json -Depth 10
Write-Host ""

# Step 2: Create cross-chain swap transaction (Wallet A -> Bridge)
Write-Host "Step 2: Creating source chain transaction (Wallet A -> Bridge)..." -ForegroundColor Green
$sourceTxBody = @{
    from = $WALLET_A
    to = $BRIDGE_CONTRACT
    value = "2.5"
    type = "eth"
} | ConvertTo-Json

$SOURCE_TX = Invoke-RestMethod -Uri "$BASE_URL/api/transactions/test" `
    -Method POST `
    -ContentType "application/json" `
    -Body $sourceTxBody
$SOURCE_TX | ConvertTo-Json -Depth 10
$SOURCE_HASH = $SOURCE_TX.transaction.hash
Write-Host "   Source Transaction Hash: $SOURCE_HASH" -ForegroundColor Yellow
Write-Host ""

# Step 3: Create destination chain transaction (Bridge -> Wallet B)
Write-Host "Step 3: Creating destination chain transaction (Bridge -> Wallet B)..." -ForegroundColor Green
$destTxBody = @{
    from = $BRIDGE_CONTRACT
    to = $WALLET_B
    value = "2.5"
    type = "eth"
} | ConvertTo-Json

$DEST_TX = Invoke-RestMethod -Uri "$BASE_URL/api/transactions/test" `
    -Method POST `
    -ContentType "application/json" `
    -Body $destTxBody
$DEST_TX | ConvertTo-Json -Depth 10
$DEST_HASH = $DEST_TX.transaction.hash
Write-Host "   Destination Transaction Hash: $DEST_HASH" -ForegroundColor Yellow
Write-Host ""

# Step 4: Verify transactions are stored in trail for Wallet A
Write-Host "Step 4: Verifying Wallet A transaction trail..." -ForegroundColor Green
$WALLET_A_TRAIL = Invoke-RestMethod -Uri "$BASE_URL/api/trail/$WALLET_A?hops=5" -Method GET
$WALLET_A_TRAIL | ConvertTo-Json -Depth 10
Write-Host ""

# Step 5: Verify transactions are stored in trail for Wallet B
Write-Host "Step 5: Verifying Wallet B transaction trail..." -ForegroundColor Green
$WALLET_B_TRAIL = Invoke-RestMethod -Uri "$BASE_URL/api/trail/$WALLET_B?hops=5" -Method GET
$WALLET_B_TRAIL | ConvertTo-Json -Depth 10
Write-Host ""

# Step 6: Check flow between Wallet A and Wallet B
Write-Host "Step 6: Checking transaction flow between Wallet A and Wallet B..." -ForegroundColor Green
$flowUrl = "$BASE_URL/api/trail/flow?from=$WALLET_A" + "&to=$WALLET_B"
$FLOW = Invoke-RestMethod -Uri $flowUrl -Method GET
$FLOW | ConvertTo-Json -Depth 10
Write-Host ""

# Step 7: Check path between Wallet A and Wallet B
Write-Host "Step 7: Finding path between Wallet A and Wallet B..." -ForegroundColor Green
$pathUrl = "$BASE_URL/api/trail/path?from=$WALLET_A" + "&to=$WALLET_B" + "&maxHops=10"
$PATH = Invoke-RestMethod -Uri $pathUrl -Method GET
$PATH | ConvertTo-Json -Depth 10
Write-Host ""

# Step 8: Get all transactions for Wallet A
Write-Host "Step 8: Getting all transactions for Wallet A..." -ForegroundColor Green
$walletATxsUrl = "$BASE_URL/api/trail/transactions/$WALLET_A?limit=10"
$WALLET_A_TXS = Invoke-RestMethod -Uri $walletATxsUrl -Method GET
$WALLET_A_TXS | ConvertTo-Json -Depth 10
Write-Host ""

# Step 9: Get all transactions for Wallet B
Write-Host "Step 9: Getting all transactions for Wallet B..." -ForegroundColor Green
$walletBTxsUrl = "$BASE_URL/api/trail/transactions/$WALLET_B?limit=10"
$WALLET_B_TXS = Invoke-RestMethod -Uri $walletBTxsUrl -Method GET
$WALLET_B_TXS | ConvertTo-Json -Depth 10
Write-Host ""

# Step 10: Verify data accuracy
Write-Host "Step 10: Verifying data accuracy..." -ForegroundColor Green

# Check if source transaction exists in Wallet A trail
$foundSource = $false
if ($WALLET_A_TRAIL.paths) {
    foreach ($path in $WALLET_A_TRAIL.paths) {
        if ($path -is [array]) {
            foreach ($step in $path) {
                if ($step.hash -eq $SOURCE_HASH) {
                    $foundSource = $true
                    break
                }
            }
        } elseif ($path.hash -eq $SOURCE_HASH) {
            $foundSource = $true
        }
    }
}

# Also check in transactions list
if (-not $foundSource) {
    if ($WALLET_A_TXS.transactions) {
        foreach ($tx in $WALLET_A_TXS.transactions) {
            if ($tx.hash -eq $SOURCE_HASH) {
                $foundSource = $true
                break
            }
        }
    }
}

if ($foundSource) {
    Write-Host "   ✅ Source transaction found in Wallet A trail" -ForegroundColor Green
} else {
    Write-Host "   ❌ Source transaction NOT found in Wallet A trail" -ForegroundColor Red
}

# Check if destination transaction exists in Wallet B trail
$foundDest = $false
if ($WALLET_B_TRAIL.paths) {
    foreach ($path in $WALLET_B_TRAIL.paths) {
        if ($path -is [array]) {
            foreach ($step in $path) {
                if ($step.hash -eq $DEST_HASH) {
                    $foundDest = $true
                    break
                }
            }
        } elseif ($path.hash -eq $DEST_HASH) {
            $foundDest = $true
        }
    }
}

# Also check in transactions list
if (-not $foundDest) {
    if ($WALLET_B_TXS.transactions) {
        foreach ($tx in $WALLET_B_TXS.transactions) {
            if ($tx.hash -eq $DEST_HASH) {
                $foundDest = $true
                break
            }
        }
    }
}

if ($foundDest) {
    Write-Host "   ✅ Destination transaction found in Wallet B trail" -ForegroundColor Green
} else {
    Write-Host "   ❌ Destination transaction NOT found in Wallet B trail" -ForegroundColor Red
}

# Check transaction values
$SOURCE_VALUE = $SOURCE_TX.transaction.valueEth
$DEST_VALUE = $DEST_TX.transaction.valueEth
Write-Host "   Source value: $SOURCE_VALUE ETH" -ForegroundColor Yellow
Write-Host "   Destination value: $DEST_VALUE ETH" -ForegroundColor Yellow
if ($SOURCE_VALUE -eq $DEST_VALUE) {
    Write-Host "   ✅ Values match correctly" -ForegroundColor Green
} else {
    Write-Host "   ❌ Values do NOT match" -ForegroundColor Red
}

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "Test Complete!" -ForegroundColor Green
Write-Host ""

