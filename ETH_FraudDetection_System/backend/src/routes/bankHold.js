const express = require('express');
const router = express.Router();
const BankHoldService = require('../services/bankHoldService');
const FabricClient = require('../services/fabricClient');

const bankHoldService = new BankHoldService();
const fabricClient = new FabricClient();

// Listen for FreezeActivated events and trigger bank hold
fabricClient.listenForEvents(async (event) => {
  if (event.type === 'FreezeActivated') {
    const { case_id, asset_refs } = event.payload;
    
    console.log(`🔄 FreezeActivated event received for case ${case_id}`);
    
    // Get case details
    try {
      const caseObj = await fabricClient.getCase(case_id);
      
      // Place holds for all asset references
      for (const assetRef of asset_refs) {
        try {
          const holdResult = await bankHoldService.placeHold(
            case_id,
            assetRef,
            caseObj.evidence_hash
          );
          
          console.log(`✅ Hold placed: ${holdResult.hold_id} for asset ${assetRef}`);
        } catch (error) {
          console.error(`❌ Failed to place hold for asset ${assetRef}:`, error.message);
        }
      }
    } catch (error) {
      console.error('Error processing FreezeActivated event:', error);
    }
  }
});

/**
 * POST /api/bank-hold/place
 * Manually place a bank hold
 */
router.post('/place', async (req, res) => {
  try {
    const { caseId, assetRef, evidenceHash, evidenceBundleUrl } = req.body;

    if (!caseId || !assetRef || !evidenceHash) {
      return res.status(400).json({
        error: 'Missing required fields: caseId, assetRef, evidenceHash'
      });
    }

    const result = await bankHoldService.placeHold(
      caseId,
      assetRef,
      evidenceHash,
      evidenceBundleUrl
    );

    res.json({
      ok: true,
      result: result
    });
  } catch (error) {
    console.error('Error placing bank hold:', error);
    res.status(500).json({
      error: 'Failed to place bank hold',
      message: error.message
    });
  }
});

/**
 * GET /api/bank-hold/:holdId
 * Get hold status
 */
router.get('/:holdId', async (req, res) => {
  try {
    const { holdId } = req.params;
    const hold = await bankHoldService.getHoldStatus(holdId);

    res.json({
      ok: true,
      hold: hold
    });
  } catch (error) {
    console.error('Error fetching hold status:', error);
    res.status(404).json({
      error: 'Hold not found',
      message: error.message
    });
  }
});

module.exports = router;

