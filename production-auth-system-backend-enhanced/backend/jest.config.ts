import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  roots: ['<rootDir>/src', '<rootDir>/test'],
  testMatch: ['**/test/**/*.test.ts'],
  setupFilesAfterEnv: [], // If you had a setup file, e.g., for mock DB, it would go here
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['json', 'lcov', 'text', 'clover'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/server.ts', // Exclude server entry point
    '!src/app.ts',    // Exclude app setup
    '!src/ormconfig.ts', // Exclude TypeORM config
    '!src/migrations/**/*.ts', // Exclude migrations
    '!src/types/**/*.d.ts' // Exclude declaration files
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
    },
  },
};

export default config;