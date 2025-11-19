const express = require('express');
const router = express.Router();
const Neo4jClient = require('../graph/neo4jClient');
const { getSharedGraph } = require('../graph/sharedMemoryGraph');
require('dotenv').config();

// Use memory graph if enabled, otherwise Neo4j
const USE_MEMORY = process.env.USE_MEMORY_GRAPH === 'true' || !process.env.NEO4J_URI;
const graphClient = USE_MEMORY ? getSharedGraph() : new Neo4jClient();

/**
 * POST /api/graph/ingest
 * Ingest a transfer event into Neo4j
 */
router.post('/ingest', async (req, res) => {
  try {
    const transferEvent = req.body;

    if (!transferEvent.event_id || !transferEvent.from || !transferEvent.to) {
      return res.status(400).json({
        error: 'Missing required fields: event_id, from, to'
      });
    }

    const result = await graphClient.ingestTransferEvent(transferEvent);

    res.json({
      ok: true,
      result: result
    });
  } catch (error) {
    console.error('Error ingesting transfer event:', error);
    res.status(500).json({
      error: 'Failed to ingest transfer event',
      message: error.message
    });
  }
});

/**
 * POST /api/graph/stitch/bank
 * Stitch bank account to wallet identity
 */
router.post('/stitch/bank', async (req, res) => {
  try {
    const { bankAccountHash, walletAddress } = req.body;

    if (!bankAccountHash || !walletAddress) {
      return res.status(400).json({
        error: 'Missing required fields: bankAccountHash, walletAddress'
      });
    }

    const result = await graphClient.stitchIdentity(bankAccountHash, walletAddress);

    res.json({
      ok: true,
      result: result
    });
  } catch (error) {
    console.error('Error stitching bank identity:', error);
    res.status(500).json({
      error: 'Failed to stitch identity',
      message: error.message
    });
  }
});

/**
 * POST /api/graph/stitch/exchange
 * Stitch exchange order to wallet identity
 */
router.post('/stitch/exchange', async (req, res) => {
  try {
    const { exchangeOrderId, walletAddress } = req.body;

    if (!exchangeOrderId || !walletAddress) {
      return res.status(400).json({
        error: 'Missing required fields: exchangeOrderId, walletAddress'
      });
    }

    const result = await graphClient.stitchExchangeIdentity(exchangeOrderId, walletAddress);

    res.json({
      ok: true,
      result: result
    });
  } catch (error) {
    console.error('Error stitching exchange identity:', error);
    res.status(500).json({
      error: 'Failed to stitch identity',
      message: error.message
    });
  }
});

/**
 * GET /api/graph/actor/:actorId
 * Get actor details
 */
router.get('/actor/:actorId', async (req, res) => {
  try {
    const { actorId } = req.params;
    const actor = await graphClient.getActor(actorId);

    if (!actor) {
      return res.status(404).json({
        error: 'Actor not found',
        actorId: actorId
      });
    }

    res.json({
      ok: true,
      actor: actor.properties
    });
  } catch (error) {
    console.error('Error fetching actor:', error);
    res.status(500).json({
      error: 'Failed to fetch actor',
      message: error.message
    });
  }
});

/**
 * GET /api/graph/health
 * Check Neo4j connection
 */
router.get('/health', async (req, res) => {
  try {
    const isConnected = USE_MEMORY ? true : await graphClient.testConnection();
    res.json({
      ok: isConnected,
      service: 'neo4j-graph',
      connected: isConnected
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

module.exports = router;

