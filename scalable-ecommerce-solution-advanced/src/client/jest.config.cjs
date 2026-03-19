/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/tests/setupTests.ts'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy', // Mock CSS imports
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/src/tests/__mocks__/fileMock.js', // Mock image imports
  },
  testMatch: ['<rootDir>/src/tests/**/*.test.(ts|tsx)'],
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/main.tsx", // exclude entry point
    "!src/vite-env.d.ts", // exclude vite specific declaration
    "!src/types/**/*.ts" // exclude type declarations if they only contain interfaces/types
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
};