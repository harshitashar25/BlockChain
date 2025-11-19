const express = require('express');
const router = express.Router();
const MoralisClient = require('../services/moralisClient');
const Neo4jClient = require('../graph/neo4jClient');
const { getSharedGraph } = require('../graph/sharedMemoryGraph');
require('dotenv').config();

const moralisClient = new MoralisClient();

/**
 * POST /api/moralis/fetch-and-ingest
 * Fetch transfers from Moralis API and ingest into graph
 * Body: { address, chain, limit }
 */
router.post('/fetch-and-ingest', async (req, res) => {
  try {
    const { address, chain = 'eth', limit = 100 } = req.body;

    if (!address) {
      return res.status(400).json({
        error: 'Missing required field: address'
      });
    }

    // Normalize address
    const normalizedAddress = address.toLowerCase().startsWith('0x') 
      ? address.toLowerCase() 
      : address.toLowerCase().startsWith('chain:')
      ? address.toLowerCase().replace('chain:', '')
      : address.toLowerCase();

    console.log(`📥 Fetching transfers from Moralis for ${normalizedAddress} on ${chain}...`);

    // Fetch both ERC20 and native transfers
    const [erc20Transfers, nativeTransfers] = await Promise.all([
      moralisClient.getTransfers(normalizedAddress, chain, { limit }).catch(() => []),
      moralisClient.getNativeTransfers(normalizedAddress, chain, { limit }).catch(() => [])
    ]);
    
    const transfers = [...erc20Transfers, ...nativeTransfers];

    if (transfers.length === 0) {
      return res.json({
        ok: true,
        message: 'No transfers found',
        address: normalizedAddress,
        chain: chain,
        ingested: 0
      });
    }

    console.log(`✅ Fetched ${transfers.length} transfers from Moralis (${erc20Transfers.length} ERC20, ${nativeTransfers.length} native)`);

    // Get graph client (memory or Neo4j)
    const USE_MEMORY = process.env.USE_MEMORY_GRAPH === 'true' || !process.env.NEO4J_URI;
    const graph = USE_MEMORY ? getSharedGraph() : new Neo4jClient();

    // Ingest each transfer
    let ingested = 0;
    for (const transfer of transfers) {
      try {
        await graph.ingestTransferEvent(transfer);
        ingested++;
      } catch (error) {
        console.error(`Error ingesting transfer ${transfer.event_id}:`, error.message);
      }
    }

    console.log(`✅ Ingested ${ingested} transfers into graph`);

    // Get stats
    const stats = USE_MEMORY ? graph.getStats() : { actors: 'N/A', relationships: 'N/A' };

    res.json({
      ok: true,
      message: `Fetched ${transfers.length} transfers, ingested ${ingested}`,
      address: normalizedAddress,
      chain: chain,
      fetched: transfers.length,
      ingested: ingested,
      stats: stats
    });

  } catch (error) {
    console.error('Error in fetch-and-ingest:', error);
    res.status(500).json({
      error: 'Failed to fetch and ingest transfers',
      message: error.message
    });
  }
});

/**
 * POST /api/moralis/trace-from-address
 * Fetch transfers from Moralis for an address, ingest, then trace
 * Body: { address, chain, depth, hours, minAmt }
 */
router.post('/trace-from-address', async (req, res) => {
  try {
    const { address, chain = 'eth', depth = 6, hours = 48, minAmt = 0.1 } = req.body;

    if (!address) {
      return res.status(400).json({
        error: 'Missing required field: address'
      });
    }

    // Normalize address
    const normalizedAddress = address.toLowerCase().startsWith('0x') 
      ? address.toLowerCase() 
      : address.toLowerCase().startsWith('chain:')
      ? address.toLowerCase().replace('chain:', '')
      : address.toLowerCase();

    console.log(`🔍 Tracing from address: ${normalizedAddress}`);

    // Step 1: Fetch from Moralis
    const transfers = await moralisClient.getTransfers(normalizedAddress, chain, { limit: 100 });
    console.log(`📥 Fetched ${transfers.length} transfers from Moralis`);

    // Step 2: Ingest into graph
    const USE_MEMORY = process.env.USE_MEMORY_GRAPH === 'true' || !process.env.NEO4J_URI;
    const graph = USE_MEMORY ? getSharedGraph() : new Neo4jClient();

    let ingested = 0;
    for (const transfer of transfers) {
      try {
        await graph.ingestTransferEvent(transfer);
        ingested++;
      } catch (error) {
        console.error(`Error ingesting:`, error.message);
      }
    }

    // Also fetch transfers for destination addresses (2 levels deep for better path finding)
    const destinationAddresses = new Set();
    transfers.forEach(tx => {
      if (tx.to && tx.to.startsWith('0x')) {
        destinationAddresses.add(tx.to.toLowerCase());
      }
      if (tx.from && tx.from.startsWith('0x')) {
        // Also fetch incoming transfers to understand the flow
        destinationAddresses.add(tx.from.toLowerCase());
      }
    });

    console.log(`📊 Fetching transfers for ${destinationAddresses.size} related addresses...`);

    // Fetch transfers for destinations (expanded to get more data)
    const destArray = Array.from(destinationAddresses).slice(0, 10);
    for (const destAddr of destArray) {
      try {
        // Fetch both ERC20 and native transfers
        const [erc20Transfers, nativeTransfers] = await Promise.all([
          moralisClient.getTransfers(destAddr, chain, { limit: 30 }).catch(() => []),
          moralisClient.getNativeTransfers(destAddr, chain, { limit: 30 }).catch(() => [])
        ]);
        
        const allTransfers = [...erc20Transfers, ...nativeTransfers];
        
        for (const tx of allTransfers) {
          await graph.ingestTransferEvent(tx);
          ingested++;
        }
        
        if (allTransfers.length > 0) {
          console.log(`  ✅ Fetched ${allTransfers.length} transfers for ${destAddr.slice(0, 10)}...`);
        }
      } catch (error) {
        console.warn(`  ⚠️  Could not fetch transfers for ${destAddr}:`, error.message);
      }
    }

    console.log(`✅ Ingested ${ingested} total transfers`);

    // Step 3: Trace from the address
    const Tracer = require('../tracer/tracer');
    const tracer = new Tracer();

    const seed = `chain:${normalizedAddress}`;
    
    // Use more lenient parameters for better path finding
    const traceParams = {
      seed: seed,
      depth: depth || 6,
      hours: hours || 168, // Default to 7 days instead of 48 hours
      minAmt: Math.min(minAmt || 0.01, 0.01) // Lower minimum amount (0.01 instead of 100)
    };
    
    console.log(`🔍 Tracing with params:`, traceParams);
    
    const traceResult = await tracer.trace(traceParams);

    await tracer.close();

    res.json({
      ok: true,
      address: normalizedAddress,
      chain: chain,
      fetched: transfers.length,
      ingested: ingested,
      trace: traceResult
    });

  } catch (error) {
    console.error('Error in trace-from-address:', error);
    res.status(500).json({
      error: 'Failed to trace from address',
      message: error.message
    });
  }
});

module.exports = router;

