```typescript
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { dbConfig } from '../config/db.config';
import logger from '../utils/logger';

let db: Database.Database;

export const getDb = (): Database.Database => {
  if (!db) {
    logger.error('Database connection not initialized. Call initializeDatabase() first.');
    throw new Error('Database connection not initialized.');
  }
  return db;
};

export const initializeDatabase = async (): Promise<void> => {
  try {
    // Ensure the data directory exists
    if (!fs.existsSync(dbConfig.dataStorageDir)) {
      fs.mkdirSync(dbConfig.dataStorageDir, { recursive: true });
    }

    db = new Database(dbConfig.databasePath);
    db.pragma('journal_mode = WAL'); // Enable Write-Ahead Logging for better concurrency
    logger.info(`Connected to SQLite database at ${dbConfig.databasePath}`);

    await applyMigrations();
    await applySeedData();

  } catch (error) {
    logger.error('Error initializing database:', error);
    throw error;
  }
};

const applyMigrations = async (): Promise<void> => {
  const migrationsDir = dbConfig.migrationsDir;
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort(); // Ensure migrations run in order

  // Create migrations table if it doesn't exist
  db.prepare(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  for (const file of migrationFiles) {
    const migrationName = path.basename(file);
    const hasBeenApplied = db.prepare('SELECT 1 FROM migrations WHERE name = ?').get(migrationName);

    if (!hasBeenApplied) {
      logger.info(`Applying migration: ${migrationName}`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      db.exec(sql);
      db.prepare('INSERT INTO migrations (name) VALUES (?)').run(migrationName);
      logger.info(`Migration '${migrationName}' applied successfully.`);
    } else {
      logger.debug(`Migration '${migrationName}' already applied. Skipping.`);
    }
  }
  logger.info('All database migrations checked and applied.');
};

const applySeedData = async (): Promise<void> => {
    if (!fs.existsSync(dbConfig.seedFile)) {
        logger.warn(`Seed file not found at ${dbConfig.seedFile}. Skipping seed data application.`);
        return;
    }

    // Check if seed data has been applied (e.g., by checking if admin user exists)
    // This is a simple check; for complex seeding, you might use a dedicated seed_migrations table.
    const adminUser = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@example.com');
    if (adminUser) {
        logger.debug('Seed data appears to be already present. Skipping seed application.');
        return;
    }

    logger.info('Applying seed data...');
    const seedSql = fs.readFileSync(dbConfig.seedFile, 'utf8');
    db.exec(seedSql);

    // Create dummy CSV files needed by the seed data
    createDummyCsvFiles();

    logger.info('Seed data applied successfully.');
};

const createDummyCsvFiles = (): void => {
  const dummyFiles = [
    {
      path: path.join(dbConfig.dataStorageDir, 'admin_monthly_sales.csv'),
      content: 'Month,Revenue,Expenses,Profit\nJan,10000,5000,5000\nFeb,12000,6000,6000\nMar,11000,5500,5500\nApr,13000,6500,6500\nMay,15000,7000,8000\nJun,14000,6800,7200'
    },
    {
      path: path.join(dbConfig.dataStorageDir, 'user_website_traffic.csv'),
      content: 'Date,Page Views,Unique Visitors,Bounce Rate\n2023-01-01,1500,500,0.45\n2023-01-02,1700,550,0.42\n2023-01-03,1600,520,0.48'
    }
  ];

  dummyFiles.forEach(file => {
    if (!fs.existsSync(file.path)) {
      fs.writeFileSync(file.path, file.content);
      logger.info(`Created dummy CSV file: ${file.path}`);
    }
  });
};


export const closeDb = (): void => {
  if (db) {
    db.close();
    logger.info('Database connection closed.');
  }
};

// Handle graceful shutdown
process.on('SIGINT', closeDb);
process.on('SIGTERM', closeDb);
```