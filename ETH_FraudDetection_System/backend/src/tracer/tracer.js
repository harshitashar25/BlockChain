const Neo4jClient = require('../graph/neo4jClient');

/**
 * Tracer - Priority-BFS path finding with pruning
 * Finds prioritized paths from seed actor using budgeted exploration
 * Stops when reaching exchange: endpoints
 */
class Tracer {
  constructor() {
    this.neo4j = new Neo4jClient();
  }

  /**
   * Trace paths from seed actor
   * @param {object} options - Tracing options
   * @param {string} options.seed - Seed actor ID
   * @param {number} options.depth - Max depth (default: 6)
   * @param {number} options.hours - Time window in hours (default: 48)
   * @param {number} options.minAmt - Minimum amount threshold (default: 100)
   * @returns {Promise<object>} Trace results with paths, nodes, edges
   */
  async trace(options) {
    const {
      seed,
      depth = 6,
      hours = 48,
      minAmt = 100
    } = options;

    if (!seed) {
      throw new Error('Seed actor ID is required');
    }

    // Test Neo4j connection first
    try {
      const isConnected = await this.neo4j.testConnection();
      if (!isConnected) {
        throw new Error('Neo4j connection failed');
      }
    } catch (error) {
      throw new Error(`Neo4j connection error: ${error.message}`);
    }

    const timeWindow = hours * 60 * 60 * 1000; // Convert to milliseconds
    const cutoffTime = new Date(Date.now() - timeWindow);

    // Ensure seed actor exists in graph
    await this.neo4j.upsertActor(seed, { type: this._getActorType(seed) });

    // Priority queue: [risk_score * amount, actor_id, path, depth]
    const queue = [[1.0, seed, [seed], 0]];
    const visited = new Set([seed]);
    const paths = [];
    const nodes = new Map();
    const edges = new Set();

    // Track exchange endpoints found
    const exchangeEndpoints = new Set();

    // Add seed node to results
    nodes.set(seed, {
      id: seed,
      type: this._getActorType(seed),
      risk_score: 0.5
    });

    while (queue.length > 0) {
      // Pop highest priority
      queue.sort((a, b) => b[0] - a[0]); // Sort descending by priority
      const [priority, currentActor, path, currentDepth] = queue.shift();

      // Check depth limit
      if (currentDepth >= depth) {
        continue;
      }

      // Check if we've reached an exchange endpoint
      if (currentActor.startsWith('exchange:')) {
        exchangeEndpoints.add(currentActor);
        paths.push({
          path: [...path],
          endpoint: currentActor,
          depth: currentDepth,
          confidence: this._calculateConfidence(path, currentDepth)
        });
        continue; // Stop expanding from exchange nodes
      }

      // Get outgoing relationships
      const relationships = await this._getOutgoingRelationships(
        currentActor,
        cutoffTime,
        minAmt
      );

      for (const rel of relationships) {
        const nextActor = rel.to;
        const edgeKey = `${currentActor}->${nextActor}`;

        // Skip if already visited in this path (avoid cycles)
        if (path.includes(nextActor)) {
          continue;
        }

        // Calculate priority: risk_score * amount
        const riskScore = this._calculateRiskScore(nextActor, rel);
        const amount = parseFloat(rel.amount) || 0;
        const priority = riskScore * amount;

        // Add to queue if not visited or if higher priority
        if (!visited.has(nextActor) || priority > 0.5) {
          visited.add(nextActor);
          queue.push([priority, nextActor, [...path, nextActor], currentDepth + 1]);

          // Track node
          nodes.set(nextActor, {
            id: nextActor,
            type: this._getActorType(nextActor),
            risk_score: riskScore
          });

          // Track edge
          edges.add(edgeKey);
        }
      }
    }

    return {
      seed: seed,
      paths: paths,
      nodes: Array.from(nodes.values()),
      edges: Array.from(edges).map(e => {
        const [from, to] = e.split('->');
        return { from, to };
      }),
      exchange_endpoints: Array.from(exchangeEndpoints),
      total_paths: paths.length,
      total_nodes: nodes.size,
      total_edges: edges.size
    };
  }

  /**
   * Get outgoing relationships from an actor
   * @private
   */
  async _getOutgoingRelationships(actorId, cutoffTime, minAmt) {
    const session = this.neo4j.driver.session();
    try {
      // First check if actor exists
      const checkActor = await session.run(
        'MATCH (a:Actor {id: $actorId}) RETURN a',
        { actorId: actorId }
      );

      if (checkActor.records.length === 0) {
        console.log(`Actor ${actorId} not found in graph`);
        return [];
      }

      // Use a more compatible query - handle timestamp as string
      const cutoffTimeStr = cutoffTime.toISOString();
      const query = `
        MATCH (from:Actor {id: $actorId})-[r:SENT|BRIDGED]->(to:Actor)
        WHERE r.timestamp >= $cutoffTime
          AND toFloat(r.amount) >= $minAmt
        RETURN to.id as to, toFloat(r.amount) as amount, 
               COALESCE(r.token_symbol, 'ETH') as token_symbol,
               COALESCE(r.chain, 'eth') as chain, 
               COALESCE(r.tx_hash, '') as tx_hash, 
               type(r) as rel_type,
               COALESCE(r.timestamp, datetime()) as timestamp
        ORDER BY toFloat(r.amount) DESC
        LIMIT 50
      `;

      const result = await session.run(query, {
        actorId: actorId,
        cutoffTime: cutoffTimeStr,
        minAmt: parseFloat(minAmt)
      });

      return result.records.map(record => ({
        to: record.get('to'),
        amount: record.get('amount') || 0,
        token_symbol: record.get('token_symbol') || 'ETH',
        chain: record.get('chain') || 'eth',
        tx_hash: record.get('tx_hash') || '',
        rel_type: record.get('rel_type'),
        timestamp: record.get('timestamp')?.toString() || new Date().toISOString()
      }));
    } catch (error) {
      console.error(`Error getting relationships for ${actorId}:`, error.message);
      return [];
    } finally {
      await session.close();
    }
  }

  /**
   * Calculate risk score for an actor
   * @private
   */
  _calculateRiskScore(actorId, relationship) {
    let score = 0.5; // Base score

    // Higher risk for exchange actors
    if (actorId.startsWith('exchange:')) {
      score = 0.9;
    }

    // Higher risk for bridge hops
    if (relationship.rel_type === 'BRIDGED') {
      score += 0.2;
    }

    // Higher risk for large amounts
    const amount = parseFloat(relationship.amount) || 0;
    if (amount > 10000) {
      score += 0.1;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Calculate confidence for a path
   * @private
   */
  _calculateConfidence(path, depth) {
    // Confidence decreases with depth
    const depthPenalty = depth * 0.1;
    const baseConfidence = 0.8;
    return Math.max(baseConfidence - depthPenalty, 0.3);
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

  /**
   * Close connections
   */
  async close() {
    await this.neo4j.close();
  }
}

module.exports = Tracer;

