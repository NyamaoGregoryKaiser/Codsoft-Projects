```javascript
module.exports = {
  testEnvironment: 'node',
  testMatch: ["<rootDir>/src/**/*.test.js"], // Only unit/integration tests
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  collectCoverage: true,
  coverageDirectory: "coverage/unit-integration",
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "/src/config/",
    "/src/app.js",
    "/src/server.js",
    "/src/db/prisma.js",
    "/src/utils/redisClient.js",
    "/src/utils/localCache.js",
    "/src/middlewares/logger.js",
    "/src/routes/", // Routes are covered by API tests
    "/src/controllers/" // Controllers are covered by API tests
  ],
  coverageReporters: ["json", "lcov", "text", "clover"],
  verbose: true,
};
```