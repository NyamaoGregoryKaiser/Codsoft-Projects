/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['<rootDir>/tests/**/*.test.ts'],
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/server.ts", // Not directly testable in isolation
    "!src/app.ts", // Tested via integration tests
    "!src/data-source.ts", // Configuration
    "!src/config/**/*.ts", // Configuration
    "!src/types/**/*.ts", // Type definitions
    "!src/database/migrations/**/*.ts", // Migrations are for schema, not logic
    "!src/database/seeders/**/*.ts", // Seeders are for data, not logic
    "!src/utils/validation.ts", // Covered by DTO validation in controllers
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/tests/jest.setup.ts'],
};