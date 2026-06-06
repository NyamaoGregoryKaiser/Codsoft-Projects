```javascript
// globalTeardown.js
const { execSync } = require('child_process');
const path = require('path');
const dotenv = require('dotenv');

module.exports = async () => {
  dotenv.config({ path: path.resolve(__dirname, '../.env') });
  process.env.NODE_ENV = 'test';

  console.log('\nCleaning up test database...');
  try {
    // Optional: Clean up test data if not using migrate reset in setup
    // For simplicity, `migrate reset` in setup handles cleanup
    // If you started docker-compose for tests, you might want to stop it here
    // execSync('docker-compose down', { stdio: 'inherit' });
    console.log('Test database cleanup complete.');
  } catch (error) {
    console.error('Failed to cleanup test database:', error.message);
    process.exit(1);
  }
};
```