module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ["<rootDir>/tests/unit/**/*.test.ts"],
  moduleNameMapper: {
    "^@config/(.*)$": "<rootDir>/src/config/$1",
    "^@constants/(.*)$": "<rootDir>/src/constants/$1",
    "^@controllers/(.*)$": "<rootDir>/src/controllers/$1",
    "^@middleware/(.*)$": "<rootDir>/src/middleware/$1",
    "^@models/(.*)$": "<rootDir>/src/models/$1",
    "^@routes/(.*)$": "<rootDir>/src/routes/$1",
    "^@services/(.*)$": "<rootDir>/src/services/$1",
    "^@utils/(.*)$": "<rootDir>/src/utils/$1",
    "^@validation/(.*)$": "<rootDir>/src/validation/$1",
    "^@tests/(.*)$": "<rootDir>/tests/$1"
  },
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/app.ts",
    "!src/server.ts",
    "!src/routes/**/*.ts",
    "!src/config/**/*.ts",
    "!src/constants/**/*.ts",
    "!src/utils/logger.ts", // Logger typically doesn't need unit test coverage for its internal logic
    "!src/utils/response.ts", // Simple response formatting
    "!src/validation/*.ts", // Zod schemas are declarative, less logic to test directly
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["json", "lcov", "text", "clover"],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
    },
  },
};