module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/server/tests/**/*.test.js'],
  coverageDirectory: './server/coverage',
  collectCoverageFrom: [
    './server/src/**/*.js',
    '!./server/src/server.js', // Exclude entry point
    '!./server/src/app.js', // Exclude app config
    '!./server/src/config/*.js', // Exclude config files
    '!./server/src/routes/*.js', // Routes are mostly definitions, tested via controllers
    '!./server/src/models/*.js', // Prisma/Redis client instances
    '!./server/src/middleware/requestLogger.js', // Simple logger
  ],
  setupFilesAfterEnv: ['<rootDir>/server/tests/setup.js'],
  globalTeardown: '<rootDir>/server/tests/teardown.js',
};