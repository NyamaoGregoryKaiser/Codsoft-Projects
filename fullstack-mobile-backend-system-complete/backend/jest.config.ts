import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  clearMocks: true,
  restoreMocks: true,
  moduleDirectories: ['node_modules', 'src'],
  testMatch: ["<rootDir>/tests/**/*.test.ts"],
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/server.ts", // Entry point
    "!src/app.ts",    // Express app setup
    "!src/config/*.ts", // Config files
    "!src/types/*.ts",  // Type definitions
    "!src/middleware/loggerMiddleware.ts", // Simple logger middleware
    "!src/modules/auth/auth.routes.ts", // Routes are tested via controllers
    "!src/modules/users/user.routes.ts",
    "!src/modules/tasks/task.routes.ts",
  ],
  coverageDirectory: "coverage",
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "/dist/",
    "/tests/",
    "/prisma/",
  ],
  setupFilesAfterEnv: ["<rootDir>/tests/setupTests.ts"],
  globalTeardown: "<rootDir>/tests/globalTeardown.ts",
};

export default config;