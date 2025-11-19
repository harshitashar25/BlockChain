# Simple PowerShell test for cross-chain swap transaction trail
$ErrorActionPreference = "Continue"

$BASE_URL = "http://localhost:5000"
$WALLET_A = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb5"
$WALLET_B = "0x8ba1f109551bD432803012645Hac136c22C3c0d7"
$BRIDGE_CONTRACT = "0x8484ef722627bf18ca5ae6bcf031c23e6e922b30"

Write-Host "Testing Cross-Chain Swap Transaction Trail" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Add wallets
Write-Host "Step 1: Adding wallets..." -ForegroundColor Yellow
try {
    $r1 = Invoke-RestMethod -Uri "$BASE_URL/api/track/address" -Method POST -ContentType "application/json" -Body (@{address=$WALLET_A} | ConvertTo-Json)
    Write-Host "  Wallet A added: $($r1.success)" -ForegroundColor Green
    
    $r2 = Invoke-RestMethod -Uri "$BASE_URL/api/track/address" -Method POST -ContentType "application/json" -Body (@{address=$WALLET_B} | ConvertTo-Json)
    Write-Host "  Wallet B added: $($r2.success)" -ForegroundColor Green
} catch {
    Write-Host "  Error: $_" -ForegroundColor Red
}
Write-Host ""

# Step 2: Create source transaction (Wallet A -> Bridge)
Write-Host "Step 2: Creating source transaction (Wallet A -> Bridge)..." -ForegroundColor Yellow
try {
    $sourceBody = @{
        from = $WALLET_A
        to = $BRIDGE_CONTRACT
        value = "2.5"
        type = "eth"
    } | ConvertTo-Json
    
    $sourceTx = Invoke-RestMethod -Uri "$BASE_URL/api/transactions/test" -Method POST -ContentType "application/json" -Body $sourceBody
    $SOURCE_HASH = $sourceTx.transaction.hash
    $SOURCE_VALUE = $sourceTx.transaction.valueEth
    Write-Host "  Source TX Hash: $SOURCE_HASH" -ForegroundColor Green
    Write-Host "  Source Value: $SOURCE_VALUE ETH" -ForegroundColor Green
} catch {
    Write-Host "  Error: $_" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 3: Create destination transaction (Bridge -> Wallet B)
Write-Host "Step 3: Creating destination transaction (Bridge -> Wallet B)..." -ForegroundColor Yellow
try {
    $destBody = @{
        from = $BRIDGE_CONTRACT
        to = $WALLET_B
        value = "2.5"
        type = "eth"
    } | ConvertTo-Json
    
    $destTx = Invoke-RestMethod -Uri "$BASE_URL/api/transactions/test" -Method POST -ContentType "application/json" -Body $destBody
    $DEST_HASH = $destTx.transaction.hash
    $DEST_VALUE = $destTx.transaction.valueEth
    Write-Host "  Destination TX Hash: $DEST_HASH" -ForegroundColor Green
    Write-Host "  Destination Value: $DEST_VALUE ETH" -ForegroundColor Green
} catch {
    Write-Host "  Error: $_" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 4: Check Wallet A trail
Write-Host "Step 4: Checking Wallet A transaction trail..." -ForegroundColor Yellow
try {
    $trailA = Invoke-RestMethod -Uri "$BASE_URL/api/trail/$WALLET_A" -Method GET
    Write-Host "  Transaction Count: $($trailA.transactionCount)" -ForegroundColor Cyan
    Write-Host "  Paths Found: $($trailA.paths.Count)" -ForegroundColor Cyan
} catch {
    Write-Host "  Error: $_" -ForegroundColor Red
}
Write-Host ""

# Step 5: Check Wallet B trail
Write-Host "Step 5: Checking Wallet B transaction trail..." -ForegroundColor Yellow
try {
    $trailB = Invoke-RestMethod -Uri "$BASE_URL/api/trail/$WALLET_B" -Method GET
    Write-Host "  Transaction Count: $($trailB.transactionCount)" -ForegroundColor Cyan
    Write-Host "  Paths Found: $($trailB.paths.Count)" -ForegroundColor Cyan
} catch {
    Write-Host "  Error: $_" -ForegroundColor Red
}
Write-Host ""

# Step 6: Get Wallet A transactions
Write-Host "Step 6: Getting Wallet A transactions..." -ForegroundColor Yellow
try {
    $txsA = Invoke-RestMethod -Uri "$BASE_URL/api/trail/transactions/$WALLET_A" -Method GET
    $foundSource = $txsA.transactions | Where-Object { $_.hash -eq $SOURCE_HASH }
    if ($foundSource) {
        Write-Host "  SUCCESS: Source transaction found in Wallet A trail" -ForegroundColor Green
        Write-Host "    Hash: $($foundSource.hash)" -ForegroundColor Cyan
        Write-Host "    Value: $($foundSource.valueEth) ETH" -ForegroundColor Cyan
    } else {
        Write-Host "  FAILED: Source transaction NOT found in Wallet A trail" -ForegroundColor Red
    }
} catch {
    Write-Host "  Error: $_" -ForegroundColor Red
}
Write-Host ""

# Step 7: Get Wallet B transactions
Write-Host "Step 7: Getting Wallet B transactions..." -ForegroundColor Yellow
try {
    $txsB = Invoke-RestMethod -Uri "$BASE_URL/api/trail/transactions/$WALLET_B" -Method GET
    $foundDest = $txsB.transactions | Where-Object { $_.hash -eq $DEST_HASH }
    if ($foundDest) {
        Write-Host "  SUCCESS: Destination transaction found in Wallet B trail" -ForegroundColor Green
        Write-Host "    Hash: $($foundDest.hash)" -ForegroundColor Cyan
        Write-Host "    Value: $($foundDest.valueEth) ETH" -ForegroundColor Cyan
    } else {
        Write-Host "  FAILED: Destination transaction NOT found in Wallet B trail" -ForegroundColor Red
    }
} catch {
    Write-Host "  Error: $_" -ForegroundColor Red
}
Write-Host ""

# Step 8: Check flow between wallets
Write-Host "Step 8: Checking flow between Wallet A and Wallet B..." -ForegroundColor Yellow
try {
    $flowUrl = "$BASE_URL/api/trail/flow?from=$WALLET_A" + "&to=$WALLET_B"
    $flow = Invoke-RestMethod -Uri $flowUrl -Method GET
    Write-Host "  Flows Found: $($flow.count)" -ForegroundColor Cyan
    if ($flow.flows -and $flow.flows.Count -gt 0) {
        Write-Host "  SUCCESS: Flow detected between wallets" -ForegroundColor Green
    } else {
        Write-Host "  NOTE: No direct flow found (expected if bridge is intermediate)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  Error: $_" -ForegroundColor Red
}
Write-Host ""

# Step 9: Verify values match
Write-Host "Step 9: Verifying data accuracy..." -ForegroundColor Yellow
if ($SOURCE_VALUE -eq $DEST_VALUE) {
    Write-Host "  SUCCESS: Transaction values match ($SOURCE_VALUE ETH)" -ForegroundColor Green
} else {
    Write-Host "  FAILED: Values do not match (Source: $SOURCE_VALUE, Dest: $DEST_VALUE)" -ForegroundColor Red
}
Write-Host ""

Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "Test Complete!" -ForegroundColor Green
Write-Host ""

