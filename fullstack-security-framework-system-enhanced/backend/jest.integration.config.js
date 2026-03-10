const config = require('./jest.config');

module.exports = {
  ...config,
  testMatch: ["<rootDir>/tests/integration/**/*.test.ts"],
  setupFilesAfterEnv: ["<rootDir>/tests/integration/setup.ts"], // For database cleanup, etc.
  globalTeardown: "<rootDir>/tests/integration/teardown.ts",
};