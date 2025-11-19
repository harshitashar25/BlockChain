const express = require('express');
const router = express.Router();
const { getSharedGraph } = require('../graph/sharedMemoryGraph');
require('dotenv').config();

/**
 * GET /api/graph/debug/stats
 * Get graph statistics for debugging
 */
router.get('/stats', async (req, res) => {
  try {
    const USE_MEMORY = process.env.USE_MEMORY_GRAPH === 'true' || !process.env.NEO4J_URI;
    
    if (!USE_MEMORY) {
      return res.json({
        ok: true,
        mode: 'neo4j',
        message: 'Use Neo4j browser for debugging'
      });
    }
    
    const graph = getSharedGraph();
    const stats = graph.getStats();
    const allActors = graph.getAllActors();
    const allRelationships = graph.getAllRelationships();
    
    // Group by type
    const actorsByType = {};
    allActors.forEach(actor => {
      const type = actor.type || 'unknown';
      actorsByType[type] = (actorsByType[type] || 0) + 1;
    });
    
    // Sample actors
    const sampleActors = allActors.slice(0, 10).map(a => ({
      id: a.id,
      type: a.type
    }));
    
    // Sample relationships
    const sampleRels = allRelationships.slice(0, 10).map(r => ({
      from: r.from,
      to: r.to,
      type: r.type,
      amount: r.amount
    }));
    
    res.json({
      ok: true,
      mode: 'memory',
      stats: stats,
      actors_by_type: actorsByType,
      sample_actors: sampleActors,
      sample_relationships: sampleRels,
      total_actors: allActors.length,
      total_relationships: allRelationships.length
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get debug stats',
      message: error.message
    });
  }
});

/**
 * GET /api/graph/debug/actor/:actorId
 * Get all relationships for a specific actor
 */
router.get('/actor/:actorId', async (req, res) => {
  try {
    const { actorId } = req.params;
    const USE_MEMORY = process.env.USE_MEMORY_GRAPH === 'true' || !process.env.NEO4J_URI;
    
    if (!USE_MEMORY) {
      return res.json({
        ok: false,
        message: 'Use Neo4j browser for actor details'
      });
    }
    
    const graph = getSharedGraph();
    const actor = await graph.getActor(actorId);
    const outgoing = await graph.getOutgoingRelationships(actorId, new Date(0), 0); // Get all, no filters
    
    res.json({
      ok: true,
      actor: actor,
      outgoing_relationships: outgoing,
      count: outgoing.length
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get actor details',
      message: error.message
    });
  }
});

module.exports = router;

