// This file is used by TypeORM to run seed data AFTER migrations.
// In a real application, you might have separate seed files for different environments
// or use a dedicated seeding library.
import { DataSource } from 'typeorm';
import AppDataSource from './datasource';
import { User } from '../modules/users/entities/User';
import * as bcrypt from 'bcryptjs';
import logger from '../config/logger';

// This is a special DataSource for seeding, it should mirror your main one
// but specifically point to the seed script if TypeORM requires it this way.
// For simplicity, we'll use the main AppDataSource and manually insert here.

export const SeedDataSource = new DataSource({
  ...AppDataSource.options,
  migrations: [], // No migrations for seed
});

export default class InitialSeed1700000000001 {
  public async run(dataSource: DataSource): Promise<void> {
    logger.info('Running seed...');
    const userRepository = dataSource.getRepository(User);

    const existingUser = await userRepository.findOne({ where: { email: 'admin@example.com' } });

    if (!existingUser) {
      const hashedPassword = await bcrypt.hash('password123', 10);

      const adminUser = userRepository.create({
        email: 'admin@example.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
      });

      await userRepository.save(adminUser);
      logger.info('Admin user seeded: admin@example.com');
    } else {
      logger.info('Admin user already exists, skipping seed.');
    }
    logger.info('Seed completed.');
  }
}

// To run this seed:
// 1. Ensure your database is clean or dropped (`npm run typeorm schema:drop`)
// 2. Run migrations (`npm run migrate`)
// 3. Manually run the seed script:
//    `ts-node -r tsconfig-paths/register src/database/seed.ts`
// Or better, integrate into `npm run seed` script as per `package.json` with a custom migration
// or a dedicated seed runner (e.g., `typeorm-extension` library).
// For the provided package.json, `npm run seed` will drop schema, run migrations, and then
// use `seed.ts` as a migration to run the `run` method.

// The `typeorm migration:run -d ./src/database/seed.ts` in package.json implies that `seed.ts` is treated as a migration.
// This is a common pattern for simplified seeding with TypeORM CLI.
```

**backend/src/middleware/errorHandler.ts**
```typescript