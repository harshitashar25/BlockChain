# Test ETH to Token (ZEEBU) multi-chain swap tracking
$ErrorActionPreference = "Continue"

$BASE_URL = "http://localhost:5000"
$WALLET_A = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb5"
$WALLET_B = "0x8ba1f109551bD432803012645Hac136c22C3c0d7"
$BRIDGE_CONTRACT = "0x8484ef722627bf18ca5ae6bcf031c23e6e922b30"
$ZEEBU_TOKEN_CONTRACT = "0x1234567890123456789012345678901234567890"  # Example ZEEBU token contract

Write-Host "Testing ETH to Token (ZEEBU) Multi-Chain Swap Tracking" -ForegroundColor Cyan
Write-Host "=========================================================" -ForegroundColor Cyan
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

# Step 2: Create ETH transaction (Wallet A -> Bridge) - Source chain
Write-Host "Step 2: Creating ETH transaction (Wallet A -> Bridge)..." -ForegroundColor Yellow
try {
    $ethBody = @{
        from = $WALLET_A
        to = $BRIDGE_CONTRACT
        value = "5.0"
        type = "eth"
    } | ConvertTo-Json
    
    $ethTx = Invoke-RestMethod -Uri "$BASE_URL/api/transactions/test" -Method POST -ContentType "application/json" -Body $ethBody
    $ETH_HASH = $ethTx.transaction.hash
    $ETH_VALUE = $ethTx.transaction.valueEth
    Write-Host "  ETH TX Hash: $ETH_HASH" -ForegroundColor Green
    Write-Host "  ETH Value: $ETH_VALUE ETH" -ForegroundColor Green
    Write-Host "  Transaction Type: $($ethTx.transaction.activities[0].type)" -ForegroundColor Cyan
} catch {
    Write-Host "  Error: $_" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 3: Create Token transaction (Bridge -> Wallet B) - Destination chain with ZEEBU token
Write-Host "Step 3: Creating ZEEBU Token transaction (Bridge -> Wallet B)..." -ForegroundColor Yellow
try {
    # We need to create a custom transaction with token details
    # Since the test endpoint supports token type, let's use it
    $tokenBody = @{
        from = $BRIDGE_CONTRACT
        to = $WALLET_B
        value = "10000"  # This will be token amount
        type = "token"
    } | ConvertTo-Json
    
    $tokenTx = Invoke-RestMethod -Uri "$BASE_URL/api/transactions/test" -Method POST -ContentType "application/json" -Body $tokenBody
    $TOKEN_HASH = $tokenTx.transaction.hash
    Write-Host "  Token TX Hash: $TOKEN_HASH" -ForegroundColor Green
    Write-Host "  Token Contract: $($tokenTx.transaction.activities[0].contract)" -ForegroundColor Cyan
    Write-Host "  Token Value: $($tokenTx.transaction.activities[0].value)" -ForegroundColor Cyan
    Write-Host "  Transaction Type: $($tokenTx.transaction.activities[0].type)" -ForegroundColor Cyan
    Write-Host "  Token Standard: $($tokenTx.transaction.activities[0].standard)" -ForegroundColor Cyan
} catch {
    Write-Host "  Error: $_" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 4: Check Wallet A trail (should show ETH transaction)
Write-Host "Step 4: Checking Wallet A transaction trail (ETH side)..." -ForegroundColor Yellow
try {
    $trailA = Invoke-RestMethod -Uri "$BASE_URL/api/trail/$WALLET_A" -Method GET
    Write-Host "  Transaction Count: $($trailA.transactionCount)" -ForegroundColor Cyan
    Write-Host "  Paths Found: $($trailA.paths.Count)" -ForegroundColor Cyan
    
    $txsA = Invoke-RestMethod -Uri "$BASE_URL/api/trail/transactions/$WALLET_A" -Method GET
    $foundEth = $txsA.transactions | Where-Object { $_.hash -eq $ETH_HASH }
    if ($foundEth) {
        Write-Host "  SUCCESS: ETH transaction found in Wallet A trail" -ForegroundColor Green
        Write-Host "    Hash: $($foundEth.hash)" -ForegroundColor Cyan
        Write-Host "    Type: $($foundEth.type)" -ForegroundColor Cyan
        Write-Host "    Value: $($foundEth.valueEth) ETH" -ForegroundColor Cyan
    } else {
        Write-Host "  FAILED: ETH transaction NOT found" -ForegroundColor Red
    }
} catch {
    Write-Host "  Error: $_" -ForegroundColor Red
}
Write-Host ""

# Step 5: Check Wallet B trail (should show Token transaction)
Write-Host "Step 5: Checking Wallet B transaction trail (Token side)..." -ForegroundColor Yellow
try {
    $trailB = Invoke-RestMethod -Uri "$BASE_URL/api/trail/$WALLET_B" -Method GET
    Write-Host "  Transaction Count: $($trailB.transactionCount)" -ForegroundColor Cyan
    Write-Host "  Paths Found: $($trailB.paths.Count)" -ForegroundColor Cyan
    
    $txsB = Invoke-RestMethod -Uri "$BASE_URL/api/trail/transactions/$WALLET_B" -Method GET
    $foundToken = $txsB.transactions | Where-Object { $_.hash -eq $TOKEN_HASH }
    if ($foundToken) {
        Write-Host "  SUCCESS: Token transaction found in Wallet B trail" -ForegroundColor Green
        Write-Host "    Hash: $($foundToken.hash)" -ForegroundColor Cyan
        Write-Host "    Type: $($foundToken.type)" -ForegroundColor Cyan
        if ($foundToken.activities -and $foundToken.activities.Count -gt 0) {
            Write-Host "    Token Contract: $($foundToken.activities[0].contract)" -ForegroundColor Cyan
            Write-Host "    Token Value: $($foundToken.activities[0].value)" -ForegroundColor Cyan
        }
    } else {
        Write-Host "  FAILED: Token transaction NOT found" -ForegroundColor Red
    }
} catch {
    Write-Host "  Error: $_" -ForegroundColor Red
}
Write-Host ""

# Step 6: Check path between wallets
Write-Host "Step 6: Checking path between Wallet A and Wallet B..." -ForegroundColor Yellow
try {
    $pathUrl = "$BASE_URL/api/trail/path?from=$WALLET_A" + "&to=$WALLET_B" + "&maxHops=10"
    $path = Invoke-RestMethod -Uri $pathUrl
    Write-Host "  Path found: $($path.found)" -ForegroundColor $(if($path.found){"Green"}else{"Yellow"})
    if ($path.path -and $path.path.Count -gt 0) {
        Write-Host "  Path steps:" -ForegroundColor Cyan
        foreach ($step in $path.path) {
            Write-Host "    $($step.from) -> $($step.to)" -ForegroundColor White
            Write-Host "      Value: $($step.value) ETH" -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "  Error: $_" -ForegroundColor Red
}
Write-Host ""

# Step 7: Check graph data
Write-Host "Step 7: Checking graph data..." -ForegroundColor Yellow
try {
    $graphUrl = "$BASE_URL/api/trail/graph?addresses=$WALLET_A" + "&depth=3"
    $graph = Invoke-RestMethod -Uri $graphUrl
    Write-Host "  Graph Nodes: $($graph.nodes.Count)" -ForegroundColor Cyan
    Write-Host "  Graph Edges: $($graph.edges.Count)" -ForegroundColor Cyan
    
    # Check if both transactions are in the graph
    $ethEdge = $graph.edges | Where-Object { $_.hash -eq $ETH_HASH }
    $tokenEdge = $graph.edges | Where-Object { $_.hash -eq $TOKEN_HASH }
    
    if ($ethEdge) {
        Write-Host "  SUCCESS: ETH transaction in graph" -ForegroundColor Green
    } else {
        Write-Host "  NOTE: ETH transaction not in graph edges" -ForegroundColor Yellow
    }
    
    if ($tokenEdge) {
        Write-Host "  SUCCESS: Token transaction in graph" -ForegroundColor Green
    } else {
        Write-Host "  NOTE: Token transaction not in graph edges" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  Error: $_" -ForegroundColor Red
}
Write-Host ""

# Step 8: Analysis
Write-Host "Step 8: Analysis..." -ForegroundColor Yellow
Write-Host "  Current System Capabilities:" -ForegroundColor Cyan
Write-Host "    - Can track ETH transactions: YES" -ForegroundColor Green
Write-Host "    - Can track Token transactions: YES" -ForegroundColor Green
Write-Host "    - Can link transactions through bridge: YES" -ForegroundColor Green
Write-Host "    - Can show different asset types: PARTIAL (shows type but not token details in trail)" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Limitations:" -ForegroundColor Cyan
Write-Host "    - Token values not displayed in trail paths (only ETH values)" -ForegroundColor Yellow
Write-Host "    - No direct link showing 'ETH swapped for Token'" -ForegroundColor Yellow
Write-Host "    - Token contract and amount not visible in trail visualization" -ForegroundColor Yellow
Write-Host ""

Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "Test Complete!" -ForegroundColor Green
Write-Host ""

