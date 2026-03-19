import type { Config } from 'jest';
import baseConfig from './jest.config';

const config: Config = {
  ...baseConfig,
  displayName: 'INTEGRATION',
  testMatch: ["<rootDir>/tests/integration/**/*.test.ts"],
  setupFilesAfterEnv: ["<rootDir>/tests/integration/setupIntegrationTests.ts"], // Specific setup for integration tests
};

export default config;