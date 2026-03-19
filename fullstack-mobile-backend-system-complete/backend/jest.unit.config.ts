import type { Config } from 'jest';
import baseConfig from './jest.config';

const config: Config = {
  ...baseConfig,
  displayName: 'UNIT',
  testMatch: ["<rootDir>/tests/unit/**/*.test.ts"],
};

export default config;