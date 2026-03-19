import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts'],
  testMatch: ['<rootDir>/src/tests/**/*.test.ts'],
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/server.ts", // exclude entry point
    "!src/app.ts",    // exclude app setup
    "!src/database/index.ts", // exclude datasource setup
    "!src/database/migrations/*.ts", // exclude migrations
    "!src/database/seed/*.ts", // exclude seeders
    "!src/types/*.d.ts", // exclude declaration files
    "!src/config/*.ts", // exclude config
    "!src/routes/*.ts" // exclude routes as they are mostly wiring
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  moduleNameMapper: {
    '^@config/(.*)$': '<rootDir>/src/config/$1',
    '^@controllers/(.*)$': '<rootDir>/src/controllers/$1',
    '^@database/(.*)$': '<rootDir>/src/database/$1',
    '^@middleware/(.*)$': '<rootDir>/src/middleware/$1',
    '^@routes/(.*)$': '<rootDir>/src/routes/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@types/(.*)$': '<rootDir>/src/types/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@validators/(.*)$': '<rootDir>/src/validators/$1',
  },
};

export default config;