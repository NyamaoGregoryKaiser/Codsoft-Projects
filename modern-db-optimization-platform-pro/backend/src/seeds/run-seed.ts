```typescript
import { AppDataSource } from '../data-source';
import { User } from '../users/user.entity';
import { DatabaseConnection } from '../database-connections/database-connection.entity';
import bcrypt from 'bcrypt';
import logger from '../shared/logger';
import { config } from '../config';
import { UserRole } from '../shared/enums';

const runSeed = async () => {
  await AppDataSource.initialize();
  logger.info('Data Source Initialized for Seeding!');

  const userRepository = AppDataSource.getRepository(User);
  const connectionRepository = AppDataSource.getRepository(DatabaseConnection);

  try {
    // Clear existing data (optional, for idempotent seeding)
    logger.info('Clearing existing database connections...');
    await connectionRepository.delete({});
    logger.info('Clearing existing users...');
    await userRepository.delete({});


    // Create Admin User
    const adminExists = await userRepository.findOneBy({ username: config.adminUser.username });
    let adminUser: User;
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash(config.adminUser.password, 10);
      adminUser = userRepository.create({
        username: config.adminUser.username,
        password: hashedPassword,
        role: config.adminUser.role,
      });
      await userRepository.save(adminUser);
      logger.info(`Admin user '${config.adminUser.username}' created.`);
    } else {
      adminUser = adminExists;
      logger.info(`Admin user '${config.adminUser.username}' already exists.`);
    }

    // Create a regular user
    const regularUserExists = await userRepository.findOneBy({ username: 'user1' });
    let regularUser: User;
    if (!regularUserExists) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      regularUser = userRepository.create({
        username: 'user1',
        password: hashedPassword,
        role: UserRole.USER,
      });
      await userRepository.save(regularUser);
      logger.info(`Regular user 'user1' created.`);
    } else {
      regularUser = regularUserExists;
      logger.info(`Regular user 'user1' already exists.`);
    }


    // Seed some example database connections for the admin user
    const exampleConnections = [
      {
        name: 'Local Dev DB',
        host: 'localhost',
        port: 5432,
        dbName: 'mydatabase',
        dbUser: 'pguser',
        dbPasswordEncrypted: await bcrypt.hash('pgpassword', 10), // This is a placeholder; in prod, use real encryption
        userId: adminUser.id,
      },
      {
        name: 'Another Test DB',
        host: '127.0.0.1',
        port: 5433,
        dbName: 'test_db',
        dbUser: 'testuser',
        dbPasswordEncrypted: await bcrypt.hash('testpass', 10),
        userId: adminUser.id,
      },
    ];

    for (const connData of exampleConnections) {
      const existingConn = await connectionRepository.findOne({ where: { userId: connData.userId, name: connData.name } });
      if (!existingConn) {
        const connection = connectionRepository.create(connData);
        await connectionRepository.save(connection);
        logger.info(`Seeded connection: ${connData.name}`);
      } else {
        logger.info(`Connection '${connData.name}' already exists for admin.`);
      }
    }

    logger.info('Seeding complete!');
  } catch (error) {
    logger.error('Seeding failed:', error);
    process.exit(1);
  } finally {
    await AppDataSource.destroy();
    logger.info('Data Source Closed after Seeding.');
  }
};

runSeed();
```