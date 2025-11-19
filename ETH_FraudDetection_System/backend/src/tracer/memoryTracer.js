const MemoryGraphClient = require('../graph/memoryGraphClient');

/**
 * Tracer using in-memory graph (alternative to Neo4j)
 */
class MemoryTracer {
  constructor() {
    this.graph = new MemoryGraphClient();
  }

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

    const timeWindow = hours * 60 * 60 * 1000;
    const cutoffTime = new Date(Date.now() - timeWindow);

    // Ensure seed actor exists
    await this.graph.upsertActor(seed, { type: this._getActorType(seed) });

    const queue = [[1.0, seed, [seed], 0]];
    const visited = new Set([seed]);
    const paths = [];
    const nodes = new Map();
    const edges = new Set();
    const exchangeEndpoints = new Set();

    nodes.set(seed, {
      id: seed,
      type: this._getActorType(seed),
      risk_score: 0.5
    });

    while (queue.length > 0) {
      queue.sort((a, b) => b[0] - a[0]);
      const [priority, currentActor, path, currentDepth] = queue.shift();

      if (currentDepth >= depth) {
        // At max depth, save the path even if not an exchange
        if (path.length > 1) {
          paths.push({
            path: [...path],
            endpoint: currentActor,
            depth: currentDepth,
            confidence: this._calculateConfidence(path, currentDepth)
          });
        }
        continue;
      }

      // Mark exchange endpoints but don't stop - continue exploring
      if (currentActor.startsWith('exchange:')) {
        exchangeEndpoints.add(currentActor);
        paths.push({
          path: [...path],
          endpoint: currentActor,
          depth: currentDepth,
          confidence: this._calculateConfidence(path, currentDepth)
        });
        // Continue exploring from exchanges too (they might send to other addresses)
      }

      const relationships = await this.graph.getOutgoingRelationships(
        currentActor,
        cutoffTime,
        minAmt
      );

      // If no relationships found and we have a path, save it
      if (relationships.length === 0 && path.length > 1 && currentDepth > 0) {
        paths.push({
          path: [...path],
          endpoint: currentActor,
          depth: currentDepth,
          confidence: this._calculateConfidence(path, currentDepth),
          is_leaf: true
        });
      }

      for (const rel of relationships) {
        const nextActor = rel.to;
        const edgeKey = `${currentActor}->${nextActor}`;

        if (path.includes(nextActor)) {
          continue; // Avoid cycles
        }

        const riskScore = this._calculateRiskScore(nextActor, rel);
        const amount = parseFloat(rel.amount) || 0;
        const priority = riskScore * amount;

        if (!visited.has(nextActor) || priority > 0.5) {
          visited.add(nextActor);
          queue.push([priority, nextActor, [...path, nextActor], currentDepth + 1]);

          nodes.set(nextActor, {
            id: nextActor,
            type: this._getActorType(nextActor),
            risk_score: riskScore
          });

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

  _calculateRiskScore(actorId, relationship) {
    let score = 0.5;
    if (actorId.startsWith('exchange:')) {
      score = 0.9;
    }
    if (relationship.rel_type === 'BRIDGED') {
      score += 0.2;
    }
    const amount = parseFloat(relationship.amount) || 0;
    if (amount > 10000) {
      score += 0.1;
    }
    return Math.min(score, 1.0);
  }

  _calculateConfidence(path, depth) {
    const depthPenalty = depth * 0.1;
    const baseConfidence = 0.8;
    return Math.max(baseConfidence - depthPenalty, 0.3);
  }

  _getActorType(actorId) {
    if (actorId.startsWith('bank:')) return 'bank';
    if (actorId.startsWith('exchange:')) return 'exchange';
    if (actorId.startsWith('chain:')) return 'chain';
    return 'unknown';
  }

  async close() {
    await this.graph.close();
  }
}

module.exports = MemoryTracer;

