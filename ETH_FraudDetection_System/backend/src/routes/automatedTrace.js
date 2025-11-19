const express = require('express');
const router = express.Router();
const AutomatedTracingService = require('../services/automatedTracing');
require('dotenv').config();

const automatedTracing = new AutomatedTracingService();

/**
 * POST /api/automated-trace/utr
 * Complete automated trace from UTR: Bank → Exchange → Wallet → Blockchain
 * Body: { utr, chain, depth, hours, minAmt }
 */
router.post('/utr', async (req, res) => {
  try {
    const { utr, chain = 'eth', depth = 6, hours = 168, minAmt = 0.01 } = req.body;

    if (!utr) {
      return res.status(400).json({
        error: 'Missing required field: utr'
      });
    }

    console.log(`🔍 Starting automated trace for UTR: ${utr}`);

    const traceResult = await automatedTracing.traceFromUTR(utr, {
      chain,
      depth,
      hours,
      minAmt
    });

    if (traceResult.success) {
      res.json({
        ok: true,
        message: 'Automated trace completed successfully',
        result: traceResult
      });
    } else {
      res.status(500).json({
        ok: false,
        error: 'Automated trace failed',
        errors: traceResult.errors,
        result: traceResult
      });
    }
  } catch (error) {
    console.error('Error in automated trace:', error);
    res.status(500).json({
      error: 'Failed to perform automated trace',
      message: error.message
    });
  }
});

/**
 * POST /api/automated-trace/utr-with-assets
 * Trace from UTR and extract asset references for freeze
 * Body: { utr, chain, depth, hours, minAmt }
 */
router.post('/utr-with-assets', async (req, res) => {
  try {
    const { utr, chain = 'eth', depth = 6, hours = 168, minAmt = 0.01 } = req.body;

    if (!utr) {
      return res.status(400).json({
        error: 'Missing required field: utr'
      });
    }

    const traceResult = await automatedTracing.traceFromUTR(utr, {
      chain,
      depth,
      hours,
      minAmt
    });

    // Extract asset references
    const assetRefs = automatedTracing.extractAssetReferences(traceResult);

    res.json({
      ok: true,
      message: 'Trace completed with asset references',
      result: traceResult,
      asset_refs: assetRefs
    });
  } catch (error) {
    console.error('Error in automated trace with assets:', error);
    res.status(500).json({
      error: 'Failed to perform automated trace',
      message: error.message
    });
  }
});

module.exports = router;

