# Verify transaction trail path and graph
$WALLET_A = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb5"
$WALLET_B = "0x8ba1f109551bD432803012645Hac136c22C3c0d7"
$BRIDGE = "0x8484ef722627bf18ca5ae6bcf031c23e6e922b30"

Write-Host "Verifying Transaction Trail Path" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Check path
Write-Host "Checking path from Wallet A to Wallet B..." -ForegroundColor Yellow
$pathUrl = "http://localhost:5000/api/trail/path?from=$WALLET_A" + "&to=$WALLET_B" + "&maxHops=10"
try {
    $path = Invoke-RestMethod -Uri $pathUrl
    Write-Host "Path found: $($path.found)" -ForegroundColor $(if($path.found){"Green"}else{"Yellow"})
    if ($path.path -and $path.path.Count -gt 0) {
        Write-Host "Path steps:" -ForegroundColor Cyan
        foreach ($step in $path.path) {
            Write-Host "  From: $($step.from) -> To: $($step.to)" -ForegroundColor White
            Write-Host "    Value: $($step.value) ETH, Hash: $($step.hash)" -ForegroundColor Gray
        }
    } else {
        Write-Host "  No direct path found (bridge is intermediate node)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}
Write-Host ""

# Check graph
Write-Host "Checking graph data for Wallet A..." -ForegroundColor Yellow
$graphUrl = "http://localhost:5000/api/trail/graph?addresses=$WALLET_A" + "&depth=3"
try {
    $graph = Invoke-RestMethod -Uri $graphUrl
    Write-Host "Graph Nodes: $($graph.nodes.Count)" -ForegroundColor Cyan
    Write-Host "Graph Edges: $($graph.edges.Count)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "First 5 edges:" -ForegroundColor Cyan
    $count = 0
    foreach ($edge in $graph.edges) {
        if ($count -lt 5) {
            Write-Host "  $($edge.from) -> $($edge.to)" -ForegroundColor White
            Write-Host "    Value: $($edge.value) ETH" -ForegroundColor Gray
            $count++
        }
    }
    
    # Check if bridge is in the graph
    $bridgeInGraph = $graph.nodes | Where-Object { $_.address -eq $BRIDGE }
    if ($bridgeInGraph) {
        Write-Host ""
        Write-Host "SUCCESS: Bridge contract found in graph!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "Bridge contract not found in graph nodes" -ForegroundColor Yellow
    }
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}
Write-Host ""

# Check Wallet A stats
Write-Host "Checking Wallet A statistics..." -ForegroundColor Yellow
try {
    $stats = Invoke-RestMethod -Uri "http://localhost:5000/api/trail/stats/$WALLET_A"
    Write-Host "  Incoming Count: $($stats.incomingCount)" -ForegroundColor Cyan
    Write-Host "  Outgoing Count: $($stats.outgoingCount)" -ForegroundColor Cyan
    Write-Host "  Total Incoming: $($stats.totalIncoming) ETH" -ForegroundColor Cyan
    Write-Host "  Total Outgoing: $($stats.totalOutgoing) ETH" -ForegroundColor Cyan
    Write-Host "  Unique Connections: $($stats.uniqueConnections)" -ForegroundColor Cyan
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}
Write-Host ""

Write-Host "=================================" -ForegroundColor Cyan
Write-Host "Verification Complete!" -ForegroundColor Green

