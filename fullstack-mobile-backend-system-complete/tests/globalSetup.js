```javascript
// globalSetup.js
const { execSync } = require('child_process');
const path = require('path');
const dotenv = require('dotenv');

module.exports = async () => {
  dotenv.config({ path: path.resolve(__dirname, '../.env') });
  process.env.NODE_ENV = 'test';

  // Ensure test database is clean and migrated before running tests
  // This assumes your docker-compose.yml defines a 'testdb' service or similar
  // For simplicity, we'll use a local db connection or expect docker-compose to handle it
  console.log('\nSetting up test database...');
  try {
    // If using docker-compose, ensure it's up before migrations
    // execSync('docker-compose up -d postgres redis', { stdio: 'inherit' });
    // execSync('sleep 5'); // Give services a moment to start

    // Drop and create database, then run migrations
    // Note: This relies on DATABASE_URL in .env pointing to your test DB
    execSync('npx prisma migrate reset --force', { stdio: 'inherit' });
    execSync('npx prisma db seed', { stdio: 'inherit' });
    console.log('Test database setup complete.');
  } catch (error) {
    console.error('Failed to setup test database:', error.message);
    process.exit(1);
  }
};
```