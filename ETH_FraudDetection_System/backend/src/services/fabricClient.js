const fs = require('fs');
const path = require('path');
require('dotenv').config();

/**
 * Fabric Client - Interacts with Hyperledger Fabric chaincode
 * For PoC: Uses file-based storage as fallback
 * In production: Uses Fabric SDK to connect to consortium network
 */
class FabricClient {
  constructor() {
    this.networkName = process.env.FABRIC_NETWORK_NAME || 'test-network';
    this.channelName = process.env.FABRIC_CHANNEL_NAME || 'mychannel';
    this.chaincodeName = process.env.FABRIC_CHAINCODE_NAME || 'fraudchain';
    
    // PoC: File-based storage fallback
    this.storagePath = path.join(__dirname, '../../fabric_requests.json');
    this.eventsPath = path.join(__dirname, '../../fabric_events.json');
    
    // Initialize storage files
    this._initStorage();
  }

  /**
   * Initialize storage files
   */
  _initStorage() {
    if (!fs.existsSync(this.storagePath)) {
      fs.writeFileSync(this.storagePath, JSON.stringify({ cases: [] }, null, 2));
    }
    if (!fs.existsSync(this.eventsPath)) {
      fs.writeFileSync(this.eventsPath, JSON.stringify({ events: [] }, null, 2));
    }
  }

  /**
   * Submit evidence to chaincode
   * @param {string} caseId - Case ID
   * @param {string} evidenceHash - SHA-256 hash of evidence bundle
   * @param {string} requester - Requester identity
   */
  async submitEvidence(caseId, evidenceHash, requester) {
    // In production: Use Fabric SDK
    // const network = await gateway.getNetwork(this.channelName);
    // const contract = network.getContract(this.chaincodeName);
    // await contract.submitTransaction('SubmitEvidence', caseId, evidenceHash, requester);

    // PoC: Store in file
    const data = JSON.parse(fs.readFileSync(this.storagePath, 'utf8'));
    
    // Check if case exists
    const existingCase = data.cases.find(c => c.case_id === caseId);
    if (existingCase) {
      throw new Error(`Case ${caseId} already exists`);
    }

    const caseObj = {
      case_id: caseId,
      evidence_hash: evidenceHash,
      requester: requester,
      requestedBy: requester, // Alias for compatibility
      created_at: new Date().toISOString(),
      status: 'SUBMITTED',
      freeze_active: false,
      approvals: [],
      requiredApprovals: 3, // 3-of-3 approval required
      asset_refs: [],
      severity: 'medium' // Default severity
    };

    data.cases.push(caseObj);
    fs.writeFileSync(this.storagePath, JSON.stringify(data, null, 2));

    // Emit event
    await this._emitEvent('FraudReported', {
      case_id: caseId,
      evidence_hash: evidenceHash,
      requester: requester
    });

    return caseObj;
  }

  /**
   * Request freeze for a case
   */
  async requestFreeze(caseId, assetRef) {
    const data = JSON.parse(fs.readFileSync(this.storagePath, 'utf8'));
    const caseObj = data.cases.find(c => c.case_id === caseId);

    if (!caseObj) {
      throw new Error(`Case ${caseId} does not exist`);
    }

    if (!caseObj.asset_refs.includes(assetRef)) {
      caseObj.asset_refs.push(assetRef);
    }

    caseObj.status = 'FREEZE_REQUESTED';
    fs.writeFileSync(this.storagePath, JSON.stringify(data, null, 2));

    return caseObj;
  }

  /**
   * Approve freeze (N-of-M multisig)
   */
  async approveFreeze(caseId, approver) {
    const data = JSON.parse(fs.readFileSync(this.storagePath, 'utf8'));
    const caseObj = data.cases.find(c => c.case_id === caseId);

    if (!caseObj) {
      throw new Error(`Case ${caseId} does not exist`);
    }

    if (caseObj.approvals.includes(approver)) {
      throw new Error(`Freeze already approved by ${approver}`);
    }

    caseObj.approvals.push(approver);

    // Check threshold (3-of-3 for production)
    const threshold = caseObj.requiredApprovals || 3;
    if (caseObj.approvals.length >= threshold) {
      caseObj.freeze_active = true;
      caseObj.status = 'FREEZE_ACTIVE';

      // Emit FreezeActivated event
      await this._emitEvent('FreezeActivated', {
        case_id: caseId,
        asset_refs: caseObj.asset_refs,
        evidence_hash: caseObj.evidence_hash
      });
    } else {
      // Update status to PENDING_APPROVAL if first approval
      if (caseObj.approvals.length === 1) {
        caseObj.status = 'PENDING_APPROVAL';
      } else {
        caseObj.status = 'FREEZE_REQUESTED';
      }
    }

    fs.writeFileSync(this.storagePath, JSON.stringify(data, null, 2));

    return caseObj;
  }

  /**
   * Get case by ID
   */
  async getCase(caseId) {
    const data = JSON.parse(fs.readFileSync(this.storagePath, 'utf8'));
    const caseObj = data.cases.find(c => c.case_id === caseId);

    if (!caseObj) {
      throw new Error(`Case ${caseId} does not exist`);
    }

    return caseObj;
  }

  /**
   * Get all cases
   */
  async getAllCases() {
    const data = JSON.parse(fs.readFileSync(this.storagePath, 'utf8'));
    return data.cases;
  }

  /**
   * Listen for Fabric events
   * @param {function} callback - Callback function for events
   */
  async listenForEvents(callback) {
    // In production: Use Fabric SDK event listener
    // const network = await gateway.getNetwork(this.channelName);
    // const listener = await network.addBlockListener('block-listener', (event) => {
    //   // Process events
    // });

    // PoC: Poll events file
    setInterval(() => {
      const events = JSON.parse(fs.readFileSync(this.eventsPath, 'utf8')).events;
      events.forEach(event => {
        if (!event.processed) {
          callback(event);
          event.processed = true;
        }
      });
      fs.writeFileSync(this.eventsPath, JSON.stringify({ events }, null, 2));
    }, 1000);
  }

  /**
   * Emit event (PoC: write to events file)
   */
  async _emitEvent(eventType, payload) {
    const events = JSON.parse(fs.readFileSync(this.eventsPath, 'utf8'));
    events.events.push({
      type: eventType,
      payload: payload,
      timestamp: new Date().toISOString(),
      processed: false
    });
    fs.writeFileSync(this.eventsPath, JSON.stringify(events, null, 2));
  }
}

module.exports = FabricClient;

