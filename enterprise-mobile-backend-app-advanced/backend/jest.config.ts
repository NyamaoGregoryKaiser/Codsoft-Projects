import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.(ts|js)?$',
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/server.ts", // Entry file is usually not tested directly
    "!src/app.ts", // App setup is covered by integration tests
    "!src/config/*.ts", // Configuration is usually not unit tested
    "!src/types.ts",
    "!src/utils/jwt.ts", // Covered by auth service/middleware
    "!src/middleware/error.middleware.ts", // Hard to test consistently
    "!src/modules/*/routes.ts", // Routes are tested via integration tests
    "!src/modules/*/validation.ts" // Zod schemas are declarative, often tested implicitly
  ],
  coverageDirectory: "coverage",
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "/tests/"
  ],
  coverageReporters: ["json", "lcov", "text", "clover"],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
    },
  },
};

export default config;