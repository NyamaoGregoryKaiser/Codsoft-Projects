```javascript
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  coverageDirectory: 'coverage',
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/app.js', // Exclude app entry
    '!src/server.js', // Exclude server entry
    '!src/routes/*.js', // Routes are mostly definitions
    '!src/models/index.js', // Model index file
    '!src/config/*.js', // Config files are mostly static
    '!src/utils/ApiError.js', // Error class
    '!src/utils/catchAsync.js', // Utility wrapper
    '!src/utils/pick.js', // Utility function
  ],
  setupFiles: ['dotenv/config'], // Load .env for tests
  testTimeout: 30000, // Increase timeout for DB operations
};
```