import { AppDataSource } from '../src/data-source';
import { logger } from '../src/config/logger';

// This file can be used for things like:
// - Mocking external services for unit tests
// - Resetting database state between integration tests (though global setup/teardown with clear() is often sufficient)

// Example: Mocking logger for tests
jest.mock('../src/config/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    http: jest.fn(),
    debug: jest.fn(),
  },
}));

// If you need to ensure a fresh state for each test, you might re-clear specific tables here.
// However, for performance, a global clear and seed is often preferred,
// and tests are written to be independent or against known seeded data.
beforeAll(async () => {
    // Ensure data source is initialized once
    if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
    }
});

afterAll(async () => {
    // No specific teardown here as globalTeardown handles closing the connection
});
```

#### `backend/tests/unit/AuthService.test.ts`
```typescript