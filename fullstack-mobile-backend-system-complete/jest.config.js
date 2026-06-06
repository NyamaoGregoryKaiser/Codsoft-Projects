```javascript
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/app.js', // Exclude main app file
    '!src/server.js', // Exclude server startup file
    '!src/routes/index.js', // Exclude route index
    '!src/config/*.js', // Exclude config files (mainly .env loading)
    '!src/database/prisma.js', // Prisma client instantiation
    '!src/utils/logger.js', // Logger setup
    '!src/utils/redis.js', // Redis client setup
    '!src/middleware/error.middleware.js', // Error handler tested via API tests
    '!src/modules/*/route.js', // Routes tested via API tests
    '!src/modules/*/validation.js', // Validation schemas are implicitly tested
  ],
  coverageReporters: ['text', 'lcov'],
  modulePathIgnorePatterns: ['<rootDir>/tests/__mocks__'],
  // Setup files to run before tests, e.g., for mocking Prisma/Redis
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  globalSetup: '<rootDir>/tests/globalSetup.js',
  globalTeardown: '<rootDir>/tests/globalTeardown.js',
  clearMocks: true,
  restoreMocks: true,
};
```