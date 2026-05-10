module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts'],
  setupFilesAfterEnv: ['./tests/setup.ts'],
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
  coverageDirectory: './coverage',
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/server.ts', // Exclude server entry file
    '!src/app.ts', // Exclude app entry file
    '!src/database/*.ts', // Exclude database config files from coverage
    '!src/types/*.d.ts', // Exclude declaration files
    '!src/error.ts', // Basic error class, less critical for coverage
    '!src/utils/logger.ts' // Logging utility, less critical for coverage
  ],
};