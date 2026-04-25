```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/server.ts',
    '!src/app.ts',
    '!src/data-source.ts',
    '!src/migrations/**',
    '!src/utils/seed.ts',
    '!src/middlewares/loggerMiddleware.ts', // Basic logging not covered
    '!src/middlewares/rateLimitMiddleware.ts', // External lib config
    '!src/utils/logger.ts' // Logging utility
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```