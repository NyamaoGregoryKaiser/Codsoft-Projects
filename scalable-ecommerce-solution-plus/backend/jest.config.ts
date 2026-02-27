import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.ts$',
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/server.ts', // Exclude server entry point
    '!src/app.ts', // Exclude app setup
    '!src/config/*.ts', // Configuration might not need direct unit tests
    '!src/types/*.ts', // Type definitions
    '!src/routes/*.ts', // Routes are integration tested
    '!src/models/*.ts' // Prisma client instance
  ],
  coverageDirectory: 'coverage/backend',
  coverageReporters: ['json', 'lcov', 'text', 'clover'],
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  setupFilesAfterEnv: [], // e.g., for global test setup
};

export default config;