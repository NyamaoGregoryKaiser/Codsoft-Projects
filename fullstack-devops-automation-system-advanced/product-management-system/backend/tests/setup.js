// This file can be used to set up any global test configurations
// or mock any external dependencies for Jest.

// Example: Mocking console.log/error to prevent noisy output during tests
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

beforeAll(() => {
  console.log = jest.fn(); // Suppress console.log
  console.error = jest.fn(); // Suppress console.error
});

afterAll(() => {
  console.log = originalConsoleLog; // Restore console.log
  console.error = originalConsoleError; // Restore console.error
});

// Example: Clearing Redis cache after each test suite (if using actual Redis)
// const { invalidateCache } = require('../src/utils/cache');
// afterEach(async () => {
//   // Invalidate relevant cache keys or clear all cache if safe for tests
//   // For integration tests that modify data, clearing cache is important
//   await invalidateCache('*'); // Example, depending on Redis client capabilities
// });
```

```