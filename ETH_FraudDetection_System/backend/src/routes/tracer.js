const express = require('express');
const router = express.Router();
const Tracer = require('../tracer/tracer');

/**
 * GET /api/tracer/trace
 * Trace paths from seed actor
 * Query params: seed, depth, hours, minAmt
 */
router.get('/trace', async (req, res) => {
  try {
    const { seed, depth, hours, minAmt } = req.query;

    if (!seed) {
      return res.status(400).json({
        error: 'Missing required parameter: seed'
      });
    }

    const tracer = new Tracer();

    const options = {
      seed: seed,
      depth: depth ? parseInt(depth, 10) : 6,
      hours: hours ? parseInt(hours, 10) : 48,
      minAmt: minAmt ? parseFloat(minAmt) : 100
    };

    const result = await tracer.trace(options);
    await tracer.close();

    res.json({
      ok: true,
      result: result
    });
  } catch (error) {
    console.error('Error in tracer:', error);
    res.status(500).json({
      error: 'Failed to trace paths',
      message: error.message
    });
  }
});

/**
 * POST /api/tracer/trace
 * Trace paths from seed actor (POST version for complex queries)
 */
router.post('/trace', async (req, res) => {
  try {
    const { seed, depth, hours, minAmt, riskScores } = req.body;

    if (!seed) {
      return res.status(400).json({
        error: 'Missing required field: seed'
      });
    }

    const tracer = new Tracer();

    const options = {
      seed: seed,
      depth: depth || 6,
      hours: hours || 48,
      minAmt: minAmt || 100
    };

    // If risk scores provided, inject them (for vendor risk scores like Chainalysis)
    if (riskScores) {
      // In production, would use these to override default risk calculation
      console.log('Using provided risk scores:', riskScores);
    }

    const result = await tracer.trace(options);
    await tracer.close();

    res.json({
      ok: true,
      result: result
    });
  } catch (error) {
    console.error('Error in tracer:', error);
    res.status(500).json({
      error: 'Failed to trace paths',
      message: error.message
    });
  }
});

module.exports = router;

