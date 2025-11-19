/**
 * In-Memory Graph Client - Alternative to Neo4j for PoC
 * Stores graph data in memory - perfect for testing and demos
 * No installation required!
 */

class MemoryGraphClient {
  constructor() {
    this.actors = new Map(); // actorId -> { id, type, properties }
    this.relationships = new Map(); // fromId -> [{ to, type, properties }]
    this.visited = new Set();
  }

  /**
   * Test connection (always works for in-memory)
   */
  async testConnection() {
    return true;
  }

  /**
   * Create or update an Actor node
   */
  async upsertActor(actorId, properties = {}) {
    if (!this.actors.has(actorId)) {
      this.actors.set(actorId, {
        id: actorId,
        type: this._getActorType(actorId),
        ...properties,
        created_at: new Date().toISOString()
      });
    } else {
      const existing = this.actors.get(actorId);
      this.actors.set(actorId, {
        ...existing,
        ...properties,
        updated_at: new Date().toISOString()
      });
    }
    return this.actors.get(actorId);
  }

  /**
   * Create a SENT relationship
   */
  async createSentRelationship(fromActorId, toActorId, transferEvent) {
    await this.upsertActor(fromActorId, { type: this._getActorType(fromActorId) });
    await this.upsertActor(toActorId, { type: this._getActorType(toActorId) });

    if (!this.relationships.has(fromActorId)) {
      this.relationships.set(fromActorId, []);
    }

    const rels = this.relationships.get(fromActorId);
    rels.push({
      to: toActorId,
      type: 'SENT',
      event_id: transferEvent.event_id,
      amount: parseFloat(transferEvent.amount) || 0,
      amount_raw: transferEvent.amount_raw || '0',
      token_symbol: transferEvent.token_symbol || 'ETH',
      chain: transferEvent.chain || 'eth',
      tx_hash: transferEvent.tx_hash || '',
      block_number: transferEvent.block_number || 0,
      timestamp: transferEvent.timestamp || new Date().toISOString()
    });

    return { from: fromActorId, to: toActorId, type: 'SENT' };
  }

  /**
   * Create a BRIDGED relationship
   */
  async createBridgedRelationship(fromActorId, toActorId, bridgeData) {
    await this.upsertActor(fromActorId, { type: this._getActorType(fromActorId) });
    await this.upsertActor(toActorId, { type: this._getActorType(toActorId) });

    if (!this.relationships.has(fromActorId)) {
      this.relationships.set(fromActorId, []);
    }

    const rels = this.relationships.get(fromActorId);
    rels.push({
      to: toActorId,
      type: 'BRIDGED',
      ...bridgeData
    });

    return { from: fromActorId, to: toActorId, type: 'BRIDGED' };
  }

  /**
   * Ingest transfer event
   */
  async ingestTransferEvent(transferEvent) {
    const fromActorId = `chain:${transferEvent.from.toLowerCase()}`;
    const toActorId = transferEvent.to.startsWith('exchange:') 
      ? transferEvent.to 
      : `chain:${transferEvent.to.toLowerCase()}`;

    await this.createSentRelationship(fromActorId, toActorId, transferEvent);

    return {
      from_actor: fromActorId,
      to_actor: toActorId,
      event_id: transferEvent.event_id
    };
  }

  /**
   * Stitch bank identity
   */
  async stitchIdentity(bankAccountHash, walletAddress) {
    const bankActorId = `bank:${bankAccountHash}`;
    const chainActorId = `chain:${walletAddress.toLowerCase()}`;

    await this.upsertActor(bankActorId, { type: 'bank' });
    await this.upsertActor(chainActorId, { type: 'chain' });

    if (!this.relationships.has(bankActorId)) {
      this.relationships.set(bankActorId, []);
    }

    this.relationships.get(bankActorId).push({
      to: chainActorId,
      type: 'IDENTITY',
      confidence: 0.9,
      source: 'bank_kyc'
    });

    return { from: bankActorId, to: chainActorId, type: 'IDENTITY' };
  }

  /**
   * Stitch exchange identity
   */
  async stitchExchangeIdentity(exchangeOrderId, walletAddress) {
    const exchangeActorId = `exchange:${exchangeOrderId}`;
    const chainActorId = `chain:${walletAddress.toLowerCase()}`;

    await this.upsertActor(exchangeActorId, { type: 'exchange' });
    await this.upsertActor(chainActorId, { type: 'chain' });

    if (!this.relationships.has(exchangeActorId)) {
      this.relationships.set(exchangeActorId, []);
    }

    this.relationships.get(exchangeActorId).push({
      to: chainActorId,
      type: 'IDENTITY',
      confidence: 0.95,
      source: 'exchange_withdrawal'
    });

    return { from: exchangeActorId, to: chainActorId, type: 'IDENTITY' };
  }

  /**
   * Get outgoing relationships (for tracer)
   */
  async getOutgoingRelationships(actorId, cutoffTime, minAmt) {
    const rels = this.relationships.get(actorId) || [];
    
    return rels
      .filter(rel => {
        const relTime = new Date(rel.timestamp || 0);
        const amount = parseFloat(rel.amount) || 0;
        return relTime >= cutoffTime && amount >= minAmt;
      })
      .map(rel => ({
        to: rel.to,
        amount: rel.amount,
        token_symbol: rel.token_symbol || 'ETH',
        chain: rel.chain || 'eth',
        tx_hash: rel.tx_hash || '',
        rel_type: rel.type,
        timestamp: rel.timestamp
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 50);
  }

  /**
   * Get actor by ID
   */
  async getActor(actorId) {
    return this.actors.get(actorId) || null;
  }

  /**
   * Get all actors (for debugging)
   */
  getAllActors() {
    return Array.from(this.actors.values());
  }

  /**
   * Get all relationships (for debugging)
   */
  getAllRelationships() {
    const all = [];
    for (const [from, rels] of this.relationships.entries()) {
      for (const rel of rels) {
        all.push({ from, to: rel.to, type: rel.type, ...rel });
      }
    }
    return all;
  }

  /**
   * Clear all data (for testing)
   */
  clear() {
    this.actors.clear();
    this.relationships.clear();
  }

  /**
   * Get stats
   */
  getStats() {
    return {
      actors: this.actors.size,
      relationships: Array.from(this.relationships.values()).reduce((sum, rels) => sum + rels.length, 0)
    };
  }

  /**
   * Close (no-op for in-memory)
   */
  async close() {
    // Nothing to close
  }

  /**
   * Get actor type from ID
   */
  _getActorType(actorId) {
    if (actorId.startsWith('bank:')) return 'bank';
    if (actorId.startsWith('exchange:')) return 'exchange';
    if (actorId.startsWith('chain:')) return 'chain';
    return 'unknown';
  }
}

module.exports = MemoryGraphClient;

