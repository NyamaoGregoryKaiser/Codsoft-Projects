const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();
const logger = require('../server/src/utils/logger');
const { BCRYPT_SALT_ROUNDS } = require('../server/src/config'); // Use server config

async function main() {
  logger.info('Starting database seeding...');

  const hashedPassword = await bcrypt.hash('password123', BCRYPT_SALT_ROUNDS);

  // Create Admin User
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });
  logger.info(`Created/updated admin user with ID: ${adminUser.id}`);

  // Create Regular User
  const regularUser = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      username: 'testuser',
      email: 'user@example.com',
      password: hashedPassword,
      role: 'USER',
    },
  });
  logger.info(`Created/updated regular user with ID: ${regularUser.id}`);

  // Create a dummy dataset (no file actually uploaded, just record)
  const dummyDataset = await prisma.dataset.upsert({
    where: { fileName: 'sample_data.csv' },
    update: {},
    create: {
      name: 'Sample Data for ML',
      fileName: 'sample_data.csv',
      filePath: '/app/uploads/sample_data.csv', // Placeholder path
      fileSize: 102400, // 100 KB
      fileMimeType: 'text/csv',
      uploadedById: regularUser.id,
      status: 'READY',
      metadata: {
        columns: [
          { name: 'feature_1', type: 'number', sample: 10.5 },
          { name: 'feature_2', type: 'string', sample: 'Category A' },
          { name: 'target', type: 'number', sample: 1 },
        ],
        rowCount: 1000,
      },
      description: 'A synthetic dataset for testing purposes.',
    },
  });
  logger.info(`Created/updated dataset: ${dummyDataset.name}`);

  // Create a dummy model
  const dummyModel = await prisma.model.upsert({
    where: { name: 'Dummy Linear Regression Model' },
    update: {},
    create: {
      name: 'Dummy Linear Regression Model',
      description: 'A simulated linear regression model.',
      algorithm: 'Linear Regression',
      parameters: { learning_rate: 0.01, epochs: 100 },
      status: 'READY',
      trainedById: regularUser.id,
      metrics: { r_squared: 0.85, mae: 0.15 },
      modelPath: '/app/models/dummy_lr.pkl',
    },
  });
  logger.info(`Created/updated model: ${dummyModel.name}`);

  // Create a dummy training job for the dataset
  const dummyTrainingJob = await prisma.trainingJob.upsert({
    where: { name: 'Initial LR Training Job' },
    update: {},
    create: {
      name: 'Initial LR Training Job',
      description: 'Training job for the sample data using LR.',
      datasetId: dummyDataset.id,
      modelId: dummyModel.id, // Link to the model created
      submittedById: regularUser.id,
      status: 'COMPLETED',
      startedAt: new Date(Date.now() - 3600000), // 1 hour ago
      completedAt: new Date(),
      logs: 'Training finished successfully. Model saved.',
      results: { final_metrics: dummyModel.metrics },
    },
  });
  logger.info(`Created/updated training job: ${dummyTrainingJob.name}`);

  // Create a dummy prediction
  await prisma.prediction.upsert({
    where: { requestId: 'pred-req-123' },
    update: {},
    create: {
      modelId: dummyModel.id,
      predictedById: regularUser.id,
      inputData: { feature_1: 12.3, feature_2: 'Category B' },
      outputData: { predicted_target: 1.25 },
      confidence: 0.92,
      requestId: 'pred-req-123',
    },
  });
  logger.info('Created/updated dummy prediction.');

  logger.info('Database seeding completed.');
}

main()
  .catch((e) => {
    logger.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });