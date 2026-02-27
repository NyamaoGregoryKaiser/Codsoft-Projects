```typescript
import { execSync } from 'child_process';
import { join } from 'path';

// This script will run once after all E2E tests have finished.
// It can be used to clean up the test database.
export default async () => {
  console.log('\nGlobal E2E Teardown: Starting database cleanup...');
  try {
    // Revert all migrations to clean up the test database
    // This assumes your TypeORM setup can revert all migrations.
    // For large numbers of migrations, it might be faster to drop/recreate.
    // Ensure this command can revert all migrations without errors.
    execSync('npm run typeorm migration:revert -- -n all', { cwd: join(__dirname, '../'), stdio: 'inherit' });
    console.log('All TypeORM migrations reverted.');
  } catch (error) {
    console.error('Global E2E Teardown failed:', error);
    // Even if teardown fails, don't prevent process from exiting
  }
};
```