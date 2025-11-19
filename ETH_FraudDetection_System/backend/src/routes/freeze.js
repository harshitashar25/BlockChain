const express = require('express');
const router = express.Router();
const FabricClient = require('../services/fabricClient');
const FreezePropagationService = require('../services/freezePropagation');
require('dotenv').config();

const fabricClient = new FabricClient();
const freezePropagation = new FreezePropagationService();

/**
 * POST /api/freeze/request
 * Request freeze for a case
 * Body: { caseId, evidenceHash, requestedBy, severity, assetRefs }
 */
router.post('/request', async (req, res) => {
  try {
    const { caseId, evidenceHash, requestedBy, severity, assetRefs } = req.body;

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

    // Request freeze for each asset reference
    if (assetRefs && assetRefs.length > 0) {
      for (const assetRef of assetRefs) {
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

module.exports = router;

