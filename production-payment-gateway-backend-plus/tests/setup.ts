```typescript
import { AppDataSource } from "../src/database/data-source";
import logger from "../src/config/logger";

beforeAll(async () => {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      logger.info("Test database connection established.");
    }
    // Optionally clear database before running tests
    // await AppDataSource.synchronize(true); // Drops and recreates schema
  } catch (error) {
    logger.error("Failed to connect to test database:", error);
    process.exit(1);
  }
});

afterAll(async () => {
  try {
    if (AppDataSource.isInitialized) {
      // Clear data after all tests for a clean slate, or truncate tables
      // await AppDataSource.dropDatabase(); // Careful with this in shared test envs
      await AppDataSource.destroy();
      logger.info("Test database connection closed.");
    }
  } catch (error) {
    logger.error("Failed to close test database connection:", error);
  }
});

// Add logic to clear tables between each test or test suite if needed
// beforeEach(async () => {
//   await AppDataSource.manager.clear(User);
//   await AppDataSource.manager.clear(Merchant);
//   // ... clear other tables
// });
```