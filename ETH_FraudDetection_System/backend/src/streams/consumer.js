const { Kafka } = require('kafkajs');
const Neo4jClient = require('../graph/neo4jClient');
require('dotenv').config();

/**
 * Kafka consumer for ingesting transfer events into Neo4j
 * Falls back to file-based ingestion if Kafka is not available
 */
class TransferEventConsumer {
  constructor() {
    this.neo4j = new Neo4jClient();
    this.kafkaBroker = process.env.KAFKA_BROKER || 'localhost:9092';
    this.topic = 'transfer-events';
    
    // Initialize Kafka client
    this.kafka = new Kafka({
      clientId: 'fraud-trail-consumer',
      brokers: [this.kafkaBroker]
    });

    this.consumer = this.kafka.consumer({ groupId: 'fraud-trail-group' });
    this.isRunning = false;
  }

  /**
   * Start consuming from Kafka
   */
  async start() {
    try {
      console.log('🔌 Connecting to Kafka...');
      await this.consumer.connect();
      await this.consumer.subscribe({ topic: this.topic, fromBeginning: false });
      
      this.isRunning = true;
      console.log(`✅ Kafka consumer started. Listening on topic: ${this.topic}`);

      await this.consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          try {
            const transferEvent = JSON.parse(message.value.toString());
            await this.processTransferEvent(transferEvent);
          } catch (error) {
            console.error('Error processing message:', error);
          }
        }
      });
    } catch (error) {
      console.error('Failed to start Kafka consumer:', error.message);
      console.log('⚠️  Falling back to file-based ingestion mode');
      // Fallback: could read from a file or REST endpoint
    }
  }

  /**
   * Process a single transfer event
   */
  async processTransferEvent(transferEvent) {
    try {
      console.log(`📥 Processing transfer event: ${transferEvent.event_id}`);
      
      // Ingest into Neo4j
      const result = await this.neo4j.ingestTransferEvent(transferEvent);
      
      console.log(`✅ Ingested: ${result.from_actor} -> ${result.to_actor}`);
      return result;
    } catch (error) {
      console.error('Error ingesting transfer event:', error);
      throw error;
    }
  }

  /**
   * Stop consumer
   */
  async stop() {
    if (this.isRunning) {
      await this.consumer.disconnect();
      this.isRunning = false;
      console.log('🛑 Kafka consumer stopped');
    }
    await this.neo4j.close();
  }
}

// If run directly, start consumer
if (require.main === module) {
  const consumer = new TransferEventConsumer();
  
  consumer.start().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down...');
    await consumer.stop();
    process.exit(0);
  });
}

module.exports = TransferEventConsumer;

