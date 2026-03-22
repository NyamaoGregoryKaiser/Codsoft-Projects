```javascript
module.exports = {
  testEnvironment: 'node',
  testMatch: ["<rootDir>/tests/api/**/*.test.js"], // Only API tests
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  globalTeardown: "<rootDir>/tests/api/teardown.js",
  collectCoverage: true,
  coverageDirectory: "coverage/api",
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "/src/config/",
    "/src/db/prisma.js",
    "/src/utils/redisClient.js",
    "/src/utils/localCache.js",
    "/src/middlewares/logger.js"
  ],
  coverageReporters: ["json", "lcov", "text", "clover"],
  verbose: true,
};
```