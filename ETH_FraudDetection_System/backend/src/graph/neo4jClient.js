const neo4j = require('neo4j-driver');
require('dotenv').config();

/**
 * Neo4j Client for fraud trail graph database
 * Handles Actor nodes and SENT/BRIDGED relationships
 */
class Neo4jClient {
  constructor() {
    const uri = process.env.NEO4J_URI || 'bolt://localhost:7687';
    const user = process.env.NEO4J_USER || 'neo4j';
    const password = process.env.NEO4J_PASSWORD || 'fraud-trail-password';

    this.driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
  }

  /**
   * Test connection
   */
  async testConnection() {
    const session = this.driver.session();
    try {
      const result = await session.run('RETURN 1 as test');
      return result.records.length > 0;
    } finally {
      await session.close();
    }
  }

  /**
   * Create or update an Actor node
   * @param {string} actorId - Canonical actor ID (e.g., "bank:ACCOUNT123", "exchange:ORDER001", "chain:0xabc...")
   * @param {object} properties - Actor properties
   */
  async upsertActor(actorId, properties = {}) {
    const session = this.driver.session();
    try {
      const query = `
        MERGE (a:Actor {id: $actorId})
        SET a += $properties,
            a.updated_at = datetime()
        RETURN a
      `;

      const result = await session.run(query, {
        actorId: actorId,
        properties: {
          ...properties,
          created_at: properties.created_at || new Date().toISOString()
        }
      });

      return result.records[0]?.get('a');
    } finally {
      await session.close();
    }
  }

  /**
   * Create a SENT relationship between two actors
   * @param {string} fromActorId - Source actor ID
   * @param {string} toActorId - Target actor ID
   * @param {object} transferEvent - Transfer event data
   */
  async createSentRelationship(fromActorId, toActorId, transferEvent) {
    const session = this.driver.session();
    try {
      // Ensure both actors exist
      await this.upsertActor(fromActorId, { type: this._getActorType(fromActorId) });
      await this.upsertActor(toActorId, { type: this._getActorType(toActorId) });

      const query = `
        MATCH (from:Actor {id: $fromActorId})
        MATCH (to:Actor {id: $toActorId})
        CREATE (from)-[r:SENT {
          event_id: $eventId,
          amount: $amount,
          amount_raw: $amountRaw,
          token_symbol: $tokenSymbol,
          chain: $chain,
          tx_hash: $txHash,
          block_number: $blockNumber,
          timestamp: $timestamp,
          created_at: datetime()
        }]->(to)
        RETURN r
      `;

      const result = await session.run(query, {
        fromActorId: fromActorId,
        toActorId: toActorId,
        eventId: transferEvent.event_id,
        amount: parseFloat(transferEvent.amount) || 0,
        amountRaw: transferEvent.amount_raw || '0',
        tokenSymbol: transferEvent.token_symbol || 'ETH',
        chain: transferEvent.chain || 'eth',
        txHash: transferEvent.tx_hash || '',
        blockNumber: transferEvent.block_number || 0,
        timestamp: transferEvent.timestamp || new Date().toISOString()
      });

      return result.records[0]?.get('r');
    } finally {
      await session.close();
    }
  }

  /**
   * Create a BRIDGED relationship (cross-chain hop)
   * @param {string} fromActorId - Source actor (chain A)
   * @param {string} toActorId - Target actor (chain B)
   * @param {object} bridgeData - Bridge event data
   */
  async createBridgedRelationship(fromActorId, toActorId, bridgeData) {
    const session = this.driver.session();
    try {
      await this.upsertActor(fromActorId, { type: this._getActorType(fromActorId) });
      await this.upsertActor(toActorId, { type: this._getActorType(toActorId) });

      const query = `
        MATCH (from:Actor {id: $fromActorId})
        MATCH (to:Actor {id: $toActorId})
        CREATE (from)-[r:BRIDGED {
          bridge_id: $bridgeId,
          nonce: $nonce,
          amount: $amount,
          from_chain: $fromChain,
          to_chain: $toChain,
          from_tx: $fromTx,
          to_tx: $toTx,
          timestamp: $timestamp,
          created_at: datetime()
        }]->(to)
        RETURN r
      `;

      const result = await session.run(query, {
        fromActorId: fromActorId,
        toActorId: toActorId,
        bridgeId: bridgeData.bridge_id || `bridge-${Date.now()}`,
        nonce: bridgeData.nonce || '',
        amount: parseFloat(bridgeData.amount) || 0,
        fromChain: bridgeData.from_chain || '',
        toChain: bridgeData.to_chain || '',
        fromTx: bridgeData.from_tx || '',
        toTx: bridgeData.to_tx || '',
        timestamp: bridgeData.timestamp || new Date().toISOString()
      });

      return result.records[0]?.get('r');
    } finally {
      await session.close();
    }
  }

  /**
   * Ingest a canonical TransferEvent into the graph
   * Creates actors and SENT relationship
   * @param {object} transferEvent - Canonical transfer event
   */
  async ingestTransferEvent(transferEvent) {
    // Determine actor IDs based on canonical naming
    const fromActorId = this._canonicalizeActorId(transferEvent.from, 'chain');
    const toActorId = this._canonicalizeActorId(transferEvent.to, 'chain');

    // Create SENT relationship
    await this.createSentRelationship(fromActorId, toActorId, transferEvent);

    return {
      from_actor: fromActorId,
      to_actor: toActorId,
      event_id: transferEvent.event_id
    };
  }

  /**
   * Link bank account to on-chain wallet (identity stitching)
   * @param {string} bankAccountHash - Hashed bank account
   * @param {string} walletAddress - On-chain wallet address
   */
  async stitchIdentity(bankAccountHash, walletAddress) {
    const session = this.driver.session();
    try {
      const bankActorId = `bank:${bankAccountHash}`;
      const chainActorId = `chain:${walletAddress.toLowerCase()}`;

      // Ensure both actors exist
      await this.upsertActor(bankActorId, { type: 'bank' });
      await this.upsertActor(chainActorId, { type: 'chain' });

      // Create IDENTITY relationship
      const query = `
        MATCH (bank:Actor {id: $bankActorId})
        MATCH (chain:Actor {id: $chainActorId})
        MERGE (bank)-[r:IDENTITY {
          confidence: $confidence,
          source: $source,
          created_at: datetime()
        }]-(chain)
        RETURN r
      `;

      const result = await session.run(query, {
        bankActorId: bankActorId,
        chainActorId: chainActorId,
        confidence: 0.9, // High confidence for bank-verified links
        source: 'bank_kyc'
      });

      return result.records[0]?.get('r');
    } finally {
      await session.close();
    }
  }

  /**
   * Link exchange order to wallet (identity stitching)
   * @param {string} exchangeOrderId - Exchange order ID
   * @param {string} walletAddress - Withdrawal wallet address
   */
  async stitchExchangeIdentity(exchangeOrderId, walletAddress) {
    const session = this.driver.session();
    try {
      const exchangeActorId = `exchange:${exchangeOrderId}`;
      const chainActorId = `chain:${walletAddress.toLowerCase()}`;

      await this.upsertActor(exchangeActorId, { type: 'exchange' });
      await this.upsertActor(chainActorId, { type: 'chain' });

      const query = `
        MATCH (exchange:Actor {id: $exchangeActorId})
        MATCH (chain:Actor {id: $chainActorId})
        MERGE (exchange)-[r:IDENTITY {
          confidence: $confidence,
          source: $source,
          created_at: datetime()
        }]-(chain)
        RETURN r
      `;

      const result = await session.run(query, {
        exchangeActorId: exchangeActorId,
        chainActorId: chainActorId,
        confidence: 0.95, // Very high confidence for exchange withdrawal
        source: 'exchange_withdrawal'
      });

      return result.records[0]?.get('r');
    } finally {
      await session.close();
    }
  }

  /**
   * Get actor by ID
   */
  async getActor(actorId) {
    const session = this.driver.session();
    try {
      const result = await session.run(
        'MATCH (a:Actor {id: $actorId}) RETURN a',
        { actorId: actorId }
      );
      return result.records[0]?.get('a');
    } finally {
      await session.close();
    }
  }

  /**
   * Close driver connection
   */
  async close() {
    await this.driver.close();
  }

  /**
   * Canonicalize actor ID based on type
   * @private
   */
  _canonicalizeActorId(identifier, type) {
    const normalized = identifier.toLowerCase();
    return `${type}:${normalized}`;
  }

  /**
   * Get actor type from ID
   * @private
   */
  _getActorType(actorId) {
    if (actorId.startsWith('bank:')) return 'bank';
    if (actorId.startsWith('exchange:')) return 'exchange';
    if (actorId.startsWith('chain:')) return 'chain';
    return 'unknown';
  }
}

module.exports = Neo4jClient;

