import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // testMatch: ["**/tests/**/*.test.ts"], // Only run files ending with .test.ts in the tests directory
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
  moduleNameMapper: {
    "^@config/(.*)$": "<rootDir>/src/config/$1",
    "^@db/(.*)$": "<rootDir>/src/db/$1",
    "^@middleware/(.*)$": "<rootDir>/src/middleware/$1",
    "^@models/(.*)$": "<rootDir>/src/models/$1",
    "^@services/(.*)$": "<rootDir>/src/services/$1",
    "^@controllers/(.*)$": "<rootDir>/src/controllers/$1",
    "^@routes/(.*)$": "<rootDir>/src/routes/$1",
    "^@utils/(.*)$": "<rootDir>/src/utils/$1",
    "^@types/(.*)$": "<rootDir>/src/types/$1"
  },
  setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"], // Setup file for database connections, etc.
  collectCoverage: true,
  coverageDirectory: "coverage",
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "/dist/",
    "/src/db/migrations/",
    "/src/db/seeds/",
    "/src/server.ts", // Entry point
    "/src/app.ts", // App setup
    "/src/routes/", // Route definitions
    "/src/config/" // Configuration files
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};

export default config;