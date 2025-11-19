const express = require('express');
const router = express.Router();
const FabricClient = require('../services/fabricClient');

const fabricClient = new FabricClient();

/**
 * POST /api/fabric/submit-evidence
 * Submit evidence to Fabric chaincode
 */
router.post('/submit-evidence', async (req, res) => {
  try {
    const { caseId, evidenceHash, requester } = req.body;

    if (!caseId || !evidenceHash || !requester) {
      return res.status(400).json({
        error: 'Missing required fields: caseId, evidenceHash, requester'
      });
    }

    const caseObj = await fabricClient.submitEvidence(caseId, evidenceHash, requester);

    res.json({
      ok: true,
      case: caseObj
    });
  } catch (error) {
    console.error('Error submitting evidence:', error);
    res.status(500).json({
      error: 'Failed to submit evidence',
      message: error.message
    });
  }
});

/**
 * POST /api/fabric/request-freeze
 * Request freeze for a case
 */
router.post('/request-freeze', async (req, res) => {
  try {
    const { caseId, assetRef } = req.body;

    if (!caseId || !assetRef) {
      return res.status(400).json({
        error: 'Missing required fields: caseId, assetRef'
      });
    }

    const caseObj = await fabricClient.requestFreeze(caseId, assetRef);

    res.json({
      ok: true,
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
 * POST /api/fabric/approve-freeze
 * Approve freeze (N-of-M multisig)
 */
router.post('/approve-freeze', async (req, res) => {
  try {
    const { caseId, approver } = req.body;

    if (!caseId || !approver) {
      return res.status(400).json({
        error: 'Missing required fields: caseId, approver'
      });
    }

    const caseObj = await fabricClient.approveFreeze(caseId, approver);

    res.json({
      ok: true,
      case: caseObj,
      freeze_activated: caseObj.freeze_active
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
 * GET /api/fabric/case/:caseId
 * Get case by ID
 */
router.get('/case/:caseId', async (req, res) => {
  try {
    const { caseId } = req.params;
    const caseObj = await fabricClient.getCase(caseId);

    res.json({
      ok: true,
      case: caseObj
    });
  } catch (error) {
    console.error('Error fetching case:', error);
    res.status(404).json({
      error: 'Case not found',
      message: error.message
    });
  }
});

/**
 * GET /api/fabric/cases
 * Get all cases
 */
router.get('/cases', async (req, res) => {
  try {
    const cases = await fabricClient.getAllCases();

    res.json({
      ok: true,
      cases: cases,
      count: cases.length
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

