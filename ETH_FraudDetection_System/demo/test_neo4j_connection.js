/**
 * Test Neo4j connection with different passwords
 */

const neo4j = require('neo4j-driver');
require('dotenv').config();

const passwords = [
  process.env.NEO4J_PASSWORD,
  'neo4j',
  'fraud-trail-password',
  'password',
  '' // empty password
].filter(p => p !== undefined);

const uri = process.env.NEO4J_URI || 'bolt://localhost:7687';
const user = process.env.NEO4J_USER || 'neo4j';

console.log(`Testing Neo4j connection to ${uri} as user: ${user}`);
console.log('Trying passwords:', passwords.map(p => p ? '***' : '(empty)').join(', '));
console.log('');

(async function() {
  for (const password of passwords) {
    try {
      const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
      const session = driver.session();
      
      const result = await session.run('RETURN 1 as test');
      await session.close();
      await driver.close();
      
      console.log(`✅ SUCCESS with password: ${password ? '***' : '(empty)'}`);
      console.log(`   Use this password in your .env: NEO4J_PASSWORD=${password || '(empty)'}`);
      process.exit(0);
    } catch (error) {
      console.log(`❌ Failed with password: ${password ? '***' : '(empty)'} - ${error.message}`);
    }
  }

  console.log('\n❌ Could not connect with any password.');
  console.log('\n💡 Solutions:');
  console.log('   1. Open Neo4j Browser: http://localhost:7474');
  console.log('   2. Login with username: neo4j');
  console.log('   3. If first time, it will ask you to change password');
  console.log('   4. Update .env with the new password: NEO4J_PASSWORD=your_new_password');
  console.log('   5. Or reset password: neo4j-admin set-initial-password your_password');
})();

console.log('\n❌ Could not connect with any password.');
console.log('\n💡 Solutions:');
console.log('   1. Open Neo4j Browser: http://localhost:7474');
console.log('   2. Login with username: neo4j');
console.log('   3. If first time, it will ask you to change password');
console.log('   4. Update .env with the new password: NEO4J_PASSWORD=your_new_password');
console.log('   5. Or reset password: neo4j-admin set-initial-password your_password');

