/**
 * Shared in-memory graph instance
 * This ensures all parts of the application use the same graph data
 */

const MemoryGraphClient = require('./memoryGraphClient');

// Create a singleton instance
let sharedInstance = null;

function getSharedGraph() {
  if (!sharedInstance) {
    sharedInstance = new MemoryGraphClient();
  }
  return sharedInstance;
}

module.exports = { getSharedGraph };

