module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(ts|tsx)$': ['@swc/jest'],
  },
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setupTests.ts'],
  testMatch: ['<rootDir>/src/**/*.test.{ts,tsx}'],
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/main.tsx",
    "!src/vite-env.d.ts",
    "!src/App.tsx", // App.tsx is mostly routing, covered by integration/e2e tests more effectively
    "!src/styles/**/*.ts",
    "!src/api/**/*.ts", // API calls are integration
    "!src/types/**/*.ts",
  ],
  coverageThreshold: {
    global: {
      branches: 70, // Slightly lower for frontend complexity
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};