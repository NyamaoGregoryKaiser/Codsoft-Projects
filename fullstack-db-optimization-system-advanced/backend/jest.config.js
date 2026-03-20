module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['./tests/setup.js'], // Global setup for mocking prisma, etc.
  moduleNameMapper: {
    '^@config/(.*)$': '<rootDir>/src/config/$1',
    '^@controllers/(.*)$': '<rootDir>/src/controllers/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@middleware/(.*)$': '<rootDir>/src/middleware/$1',
    '^@routes/(.*)$': '<rootDir>/src/routes/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@prisma/(.*)$': '<rootDir>/prisma/$1'
  },
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  collectCoverage: true,
  coverageReporters: ['json', 'lcov', 'text', 'clover'],
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "/src/server.js", // Entry point, not much logic to test directly
    "/src/app.js",    // App setup, mostly middleware wiring
    "/src/routes/index.js", // Central router, simple aggregation
    "/src/config/",    // Configuration files are typically not unit tested
    "/prisma/"         // Prisma client files/migrations
  ],
  verbose: true,
  forceExit: true, // Forces Jest to exit after all tests run, even if open handles
  detectOpenHandles: true // Helps identify issues causing `forceExit` to be needed
};
```

#### `backend/tests/setup.js` (Global setup for Jest)
```javascript