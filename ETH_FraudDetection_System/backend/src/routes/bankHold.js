const express = require('express');
const router = express.Router();
const BankHoldService = require('../services/bankHoldService');
const FabricClient = require('../services/fabricClient');
const FreezePropagationService = require('../services/freezePropagation');

const bankHoldService = new BankHoldService();
const fabricClient = new FabricClient();
const freezePropagation = new FreezePropagationService();

// Listen for FreezeActivated events and trigger automatic freeze propagation
fabricClient.listenForEvents(async (event) => {
  if (event.type === 'FreezeActivated') {
    const { case_id, asset_refs, evidence_hash } = event.payload;
    
    console.log(`🔄 FreezeActivated event received for case ${case_id}`);
    
    // Get case details
    try {
      const caseObj = await fabricClient.getCase(case_id);
      
      // NEW: Propagate freeze to all connected banks, exchanges, and wallets
      const propagationResult = await freezePropagation.propagateFreeze(
        case_id,
        asset_refs || [],
        evidence_hash || caseObj.evidence_hash
      );
      
      console.log(`✅ Freeze propagated:`);
      console.log(`   Banks: ${propagationResult.banks.successful.length}/${propagationResult.banks.total} successful`);
      console.log(`   Exchanges: ${propagationResult.exchanges.successful.length}/${propagationResult.exchanges.total} successful`);
      console.log(`   Wallets: ${propagationResult.wallets.successful.length} frozen`);
      
      // Also place individual holds (existing logic for backward compatibility)
      for (const assetRef of asset_refs || []) {
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

/**
 * GET /api/bank-hold/status/:caseId
 * Get freeze status across all banks for a case
 */
router.get('/status/:caseId', async (req, res) => {
  try {
    const { caseId } = req.params;
    const status = await freezePropagation.getFreezeStatus(caseId);
    
    res.json({
      ok: true,
      status: status
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get freeze status',
      message: error.message
    });
  }
});

module.exports = router;

