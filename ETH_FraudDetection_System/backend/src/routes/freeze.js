const express = require('express');
const router = express.Router();
const FabricClient = require('../services/fabricClient');
const FreezePropagationService = require('../services/freezePropagation');
const AutomatedTracingService = require('../services/automatedTracing');
require('dotenv').config();

const fabricClient = new FabricClient();
const freezePropagation = new FreezePropagationService();
const automatedTracing = new AutomatedTracingService();

/**
 * POST /api/freeze/request
 * Request freeze for a case
 * Body: { caseId, evidenceHash, requestedBy, severity, assetRefs, utr }
 * If assetRefs not provided but utr is provided, will auto-trace
 */
router.post('/request', async (req, res) => {
  try {
    const { caseId, evidenceHash, requestedBy, severity, assetRefs, utr } = req.body;

    if (!caseId || !evidenceHash || !requestedBy) {
      return res.status(400).json({
        error: 'Missing required fields: caseId, evidenceHash, requestedBy'
      });
    }

    // Submit evidence if not already submitted
    let caseObj;
    try {
      caseObj = await fabricClient.getCase(caseId);
    } catch (error) {
      // Case doesn't exist, create it
      caseObj = await fabricClient.submitEvidence(caseId, evidenceHash, requestedBy);
    }

    // If assetRefs not provided but UTR is provided, run automated trace
    let finalAssetRefs = assetRefs;
    if ((!assetRefs || assetRefs.length === 0) && utr) {
      console.log(`🔍 Auto-tracing from UTR: ${utr}`);
      try {
        const traceResult = await automatedTracing.traceFromUTR(utr, {
          chain: 'eth',
          depth: 6,
          hours: 168
        });
        
        if (traceResult.success) {
          finalAssetRefs = automatedTracing.extractAssetReferences(traceResult);
          console.log(`✅ Auto-trace found ${finalAssetRefs.length} asset references`);
        }
      } catch (error) {
        console.error('Auto-trace error:', error);
        // Continue without asset refs
      }
    }

    // Request freeze for each asset reference
    if (finalAssetRefs && finalAssetRefs.length > 0) {
      for (const assetRef of finalAssetRefs) {
        await fabricClient.requestFreeze(caseId, assetRef);
      }
    } else {
      // Request freeze without specific assets
      await fabricClient.requestFreeze(caseId, 'all');
    }

    // Update case with severity if provided
    if (severity) {
      caseObj.severity = severity;
    }

    // Get updated case
    caseObj = await fabricClient.getCase(caseId);

    res.json({
      ok: true,
      status: caseObj.status,
      approvals: caseObj.approvals || [],
      requiredApprovals: caseObj.requiredApprovals || 3,
      asset_refs: caseObj.asset_refs || [],
      case: caseObj
    });
  } catch (error) {
    console.error('Error requesting freeze:', error);
    res.status(500).json({
      error: 'Failed to request freeze',
      message: error.message
    });
  }
});

/**
 * POST /api/freeze/approve
 * Approve freeze request
 * Body: { caseId, approver, signature }
 */
router.post('/approve', async (req, res) => {
  try {
    const { caseId, approver, signature } = req.body;

    if (!caseId || !approver) {
      return res.status(400).json({
        error: 'Missing required fields: caseId, approver'
      });
    }

    // Approve freeze
    const caseObj = await fabricClient.approveFreeze(caseId, approver);

    // Check if freeze should be activated
    const requiredApprovals = caseObj.requiredApprovals || 3;
    const currentApprovals = caseObj.approvals?.length || 0;
    const freezeActivated = caseObj.freeze_active;

    // If threshold met and not yet activated, activate freeze
    if (currentApprovals >= requiredApprovals && !freezeActivated) {
      await activateFreeze(caseId);
      caseObj.freeze_active = true;
    }

    res.json({
      ok: true,
      currentApprovals: currentApprovals,
      requiredApprovals: requiredApprovals,
      freeze_activated: caseObj.freeze_active,
      case: caseObj
    });
  } catch (error) {
    console.error('Error approving freeze:', error);
    res.status(500).json({
      error: 'Failed to approve freeze',
      message: error.message
    });
  }
});

/**
 * POST /api/freeze/reject
 * Reject freeze request
 * Body: { caseId, reason }
 */
router.post('/reject', async (req, res) => {
  try {
    const { caseId, reason } = req.body;

    if (!caseId) {
      return res.status(400).json({
        error: 'Missing required field: caseId'
      });
    }

    // Update case status to rejected
    // In production, this would update Fabric chaincode
    const caseObj = await fabricClient.getCase(caseId);
    
    // For PoC, we'll just return success
    // In production, add reject logic to chaincode
    res.json({
      ok: true,
      message: 'Freeze request rejected',
      case: caseObj
    });
  } catch (error) {
    console.error('Error rejecting freeze:', error);
    res.status(500).json({
      error: 'Failed to reject freeze',
      message: error.message
    });
  }
});

/**
 * GET /api/freeze/status/:caseId
 * Get freeze status for a case
 */
router.get('/status/:caseId', async (req, res) => {
  try {
    const { caseId } = req.params;
    const caseObj = await fabricClient.getCase(caseId);

    res.json({
      ok: true,
      caseId: caseId,
      status: caseObj.status,
      approvals: caseObj.approvals || [],
      requiredApprovals: caseObj.requiredApprovals || 3,
      freeze_active: caseObj.freeze_active,
      asset_refs: caseObj.asset_refs || []
    });
  } catch (error) {
    console.error('Error fetching freeze status:', error);
    res.status(404).json({
      error: 'Case not found',
      message: error.message
    });
  }
});

/**
 * POST /api/freeze/activate
 * Manually activate freeze (called when threshold met)
 */
async function activateFreeze(caseId) {
  try {
    const caseObj = await fabricClient.getCase(caseId);
    
    // Propagate freeze to all connected banks and exchanges
    const propagationResult = await freezePropagation.propagateFreeze(
      caseId,
      caseObj.asset_refs || [],
      caseObj.evidence_hash
    );

    console.log(`✅ Freeze activated for case ${caseId}`);
    console.log(`   Propagated to ${propagationResult.successful.length} banks`);
    console.log(`   Failed at ${propagationResult.failed.length} banks`);

    return propagationResult;
  } catch (error) {
    console.error('Error activating freeze:', error);
    throw error;
  }
}

router.post('/activate', async (req, res) => {
  try {
    const { caseId } = req.body;
    if (!caseId) {
      return res.status(400).json({
        error: 'Missing required field: caseId'
      });
    }

    const result = await activateFreeze(caseId);
    res.json({
      ok: true,
      message: 'Freeze activated',
      propagation: result
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to activate freeze',
      message: error.message
    });
  }
});

/**
 * GET /api/freeze/cases
 * Get all cases with freeze status
 */
router.get('/cases', async (req, res) => {
  try {
    const cases = await fabricClient.getAllCases();
    
    // Enrich with freeze propagation status
    const enrichedCases = await Promise.all(
      cases.map(async (caseItem) => {
        if (caseItem.freeze_active) {
          try {
            const freezeStatus = await freezePropagation.getFreezeStatus(caseItem.case_id);
            return { ...caseItem, freezeStatus };
          } catch (error) {
            return caseItem;
          }
        }
        return caseItem;
      })
    );

    res.json({
      ok: true,
      cases: enrichedCases,
      count: enrichedCases.length
    });
  } catch (error) {
    console.error('Error fetching cases:', error);
    res.status(500).json({
      error: 'Failed to fetch cases',
      message: error.message
    });
  }
});

/**
 * POST /api/freeze/trace-and-update
 * Run trace for a case and update it with asset references
 * Body: { caseId, utr }
 */
router.post('/trace-and-update', async (req, res) => {
  const startTime = Date.now();
  let caseObj = null;
  
  try {
    const { caseId, utr } = req.body;

    console.log(`\n🔍 [TRACE-AND-UPDATE] Starting for caseId=${caseId}, utr=${utr}`);

    // Validate inputs
    if (!caseId || !utr) {
      return res.status(400).json({
        ok: false,
        error: 'Missing required fields',
        required: ['caseId', 'utr'],
        received: { caseId, utr }
      });
    }

    // Step 1: Get case (create if doesn't exist)
    try {
      caseObj = await fabricClient.getCase(caseId);
      console.log(`✅ [TRACE-AND-UPDATE] Case found: ${caseId}`);
    } catch (error) {
      console.log(`⚠️  [TRACE-AND-UPDATE] Case not found, creating new case...`);
      // Create case if it doesn't exist
      const evidenceHash = `hash-${Date.now()}`;
      caseObj = await fabricClient.submitEvidence(caseId, evidenceHash, 'LEA:AutoTrace');
      console.log(`✅ [TRACE-AND-UPDATE] Case created: ${caseId}`);
    }

    // Step 2: Run automated trace with detailed error handling
    console.log(`📋 [TRACE-AND-UPDATE] Starting automated trace for UTR: ${utr}`);
    let traceResult;
    try {
      traceResult = await automatedTracing.traceFromUTR(utr, {
        chain: 'eth',
        depth: 6,
        hours: 168
      });
    } catch (traceError) {
      console.error(`❌ [TRACE-AND-UPDATE] Trace execution error:`, traceError);
      return res.status(500).json({
        ok: false,
        error: 'Trace execution failed',
        message: traceError.message,
        stack: process.env.NODE_ENV === 'development' ? traceError.stack : undefined,
        step: 'trace_execution'
      });
    }

    // Step 3: Check trace result
    if (!traceResult || !traceResult.success) {
      const errors = traceResult?.errors || ['Unknown trace failure'];
      console.error(`❌ [TRACE-AND-UPDATE] Trace failed:`, errors);
      return res.status(500).json({
        ok: false,
        error: 'Trace failed',
        errors: errors,
        traceResult: traceResult,
        step: 'trace_validation'
      });
    }

    console.log(`✅ [TRACE-AND-UPDATE] Trace completed successfully`);

    // Step 4: Extract asset references
    let assetRefs = [];
    try {
      assetRefs = automatedTracing.extractAssetReferences(traceResult);
      console.log(`📊 [TRACE-AND-UPDATE] Extracted ${assetRefs.length} asset references:`, assetRefs);
    } catch (extractError) {
      console.error(`❌ [TRACE-AND-UPDATE] Asset extraction error:`, extractError);
      return res.status(500).json({
        ok: false,
        error: 'Failed to extract asset references',
        message: extractError.message,
        step: 'asset_extraction'
      });
    }

    // Step 5: Update case with asset references
    if (assetRefs.length === 0) {
      console.warn(`⚠️  [TRACE-AND-UPDATE] No asset references found, but trace succeeded`);
      // Still return success but with warning
      return res.json({
        ok: true,
        warning: 'Trace completed but no asset references found',
        asset_refs: [],
        traceResult: {
          steps: traceResult.steps,
          graph: {
            nodes_count: traceResult.graph?.nodes?.length || 0,
            edges_count: traceResult.graph?.edges?.length || 0
          }
        }
      });
    }

    console.log(`📝 [TRACE-AND-UPDATE] Updating case with ${assetRefs.length} asset references...`);
    let updateErrors = [];
    for (const assetRef of assetRefs) {
      try {
        await fabricClient.requestFreeze(caseId, assetRef);
      } catch (updateError) {
        console.error(`⚠️  [TRACE-AND-UPDATE] Failed to add asset ${assetRef}:`, updateError.message);
        updateErrors.push({ assetRef, error: updateError.message });
      }
    }

    if (updateErrors.length === assetRefs.length) {
      return res.status(500).json({
        ok: false,
        error: 'Failed to update case with any asset references',
        errors: updateErrors,
        step: 'case_update'
      });
    }

    // Step 6: Get updated case
    let updatedCase;
    try {
      updatedCase = await fabricClient.getCase(caseId);
      console.log(`✅ [TRACE-AND-UPDATE] Case updated successfully`);
    } catch (getError) {
      console.error(`⚠️  [TRACE-AND-UPDATE] Could not fetch updated case:`, getError.message);
      // Return success anyway since we updated it
      updatedCase = caseObj;
    }

    const duration = Date.now() - startTime;
    console.log(`✅ [TRACE-AND-UPDATE] Complete in ${duration}ms. Assets: ${assetRefs.length}`);

    res.json({
      ok: true,
      message: `Trace completed. Found ${assetRefs.length} asset references.`,
      asset_refs: assetRefs,
      case: updatedCase,
      traceSummary: {
        bank: traceResult.steps.bank ? '✅' : '❌',
        exchange: traceResult.steps.exchange ? '✅' : '❌',
        wallet: traceResult.steps.wallet ? '✅' : '❌',
        blockchain: traceResult.steps.blockchain ? '✅' : '❌',
        nodes: traceResult.graph?.nodes?.length || 0,
        edges: traceResult.graph?.edges?.length || 0
      },
      updateErrors: updateErrors.length > 0 ? updateErrors : undefined,
      duration_ms: duration
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ [TRACE-AND-UPDATE] Unexpected error after ${duration}ms:`, error);
    console.error('Stack:', error.stack);
    
    res.status(500).json({
      ok: false,
      error: 'Failed to trace and update',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack.split('\n').slice(0, 10) : undefined,
      step: 'unexpected_error',
      duration_ms: duration
    });
  }
});

module.exports = router;
