module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['./tests/setup.ts'],
  testMatch: ['<rootDir>/tests/**/*.test.ts'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/src/migrations/',
    '/src/seed.ts',
    '/src/server.ts',
    '/src/app.ts',
    '/src/data-source.ts',
    '/src/repositories/', // Repositories are thin wrappers; tested via services/controllers
    '/src/routes/' // Routes are just express wiring; tested via controllers
  ],
  moduleNameMapper: {
    '^@src/(.*)$': '<rootDir>/src/$1',
  },
  globalSetup: '<rootDir>/tests/globalSetup.ts',
  globalTeardown: '<rootDir>/tests/globalTeardown.ts',
};