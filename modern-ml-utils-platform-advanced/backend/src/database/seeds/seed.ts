```typescript
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../users/entities/user.entity';
import { Model } from '../../models/entities/model.entity';
import { ModelVersion } from '../../models/entities/model-version.entity';
import { Experiment } from '../../experiments/entities/experiment.entity';
import { Run } from '../../experiments/entities/run.entity';
import { Dataset } from '../../datasets/entities/dataset.entity';
import { Feature } from '../../features/entities/feature.entity';

export const seedDatabase = async (dataSource: DataSource) => {
  const userRepository = dataSource.getRepository(User);
  const modelRepository = dataSource.getRepository(Model);
  const modelVersionRepository = dataSource.getRepository(ModelVersion);
  const experimentRepository = dataSource.getRepository(Experiment);
  const runRepository = dataSource.getRepository(Run);
  const datasetRepository = dataSource.getRepository(Dataset);
  const featureRepository = dataSource.getRepository(Feature);

  // Clear existing data (optional, for development)
  await featureRepository.delete({});
  await datasetRepository.delete({});
  await runRepository.delete({});
  await experimentRepository.delete({});
  await modelVersionRepository.delete({});
  await modelRepository.delete({});
  await userRepository.delete({});

  console.log('Seeding database...');

  // 1. Create Users
  const hashedPassword = await bcrypt.hash('password123', 10);

  const adminUser = userRepository.create({
    username: 'admin',
    email: 'admin@mlflowpro.com',
    password: hashedPassword,
    role: 'admin',
  });
  await userRepository.save(adminUser);

  const regularUser = userRepository.create({
    username: 'john.doe',
    email: 'john.doe@mlflowpro.com',
    password: hashedPassword,
    role: 'user',
  });
  await userRepository.save(regularUser);

  console.log('Users seeded.');

  // 2. Create Models
  const sentimentModel = modelRepository.create({
    name: 'Sentiment Analysis Model',
    description: 'A model to classify text sentiment (positive/negative/neutral).',
    owner: adminUser,
  });
  await modelRepository.save(sentimentModel);

  const fraudModel = modelRepository.create({
    name: 'Fraud Detection Model',
    description: 'Detects fraudulent transactions.',
    owner: regularUser,
  });
  await modelRepository.save(fraudModel);

  console.log('Models seeded.');

  // 3. Create Model Versions
  const sentimentV1 = modelVersionRepository.create({
    model: sentimentModel,
    versionNumber: '1.0.0',
    artifactPath: 's3://mlflowpro-artifacts/sentiment/v1/model.pkl',
    trainingDataInfo: { source: 'IMDB Dataset', rows: 50000, features: ['text'] },
    performanceMetrics: { accuracy: 0.88, f1_score: 0.87 },
    status: 'production',
  });
  await modelVersionRepository.save(sentimentV1);

  const sentimentV2 = modelVersionRepository.create({
    model: sentimentModel,
    versionNumber: '2.0.0',
    artifactPath: 's3://mlflowpro-artifacts/sentiment/v2/model.pkl',
    trainingDataInfo: { source: 'Twitter Data', rows: 100000, features: ['text', 'hashtags'] },
    performanceMetrics: { accuracy: 0.91, f1_score: 0.90 },
    status: 'staging',
  });
  await modelVersionRepository.save(sentimentV2);

  console.log('Model Versions seeded.');

  // 4. Create Experiments
  const sentimentExp = experimentRepository.create({
    name: 'Sentiment Analysis Tuning',
    description: 'Experimenting with different NLP models for sentiment classification.',
    owner: adminUser,
  });
  await experimentRepository.save(sentimentExp);

  const fraudExp = experimentRepository.create({
    name: 'Fraud Detection Hyperparameter Optimization',
    description: 'Optimizing hyperparameters for XGBoost on transaction data.',
    owner: regularUser,
  });
  await experimentRepository.save(fraudExp);

  console.log('Experiments seeded.');

  // 5. Create Runs
  const run1Sentiment = runRepository.create({
    experiment: sentimentExp,
    runName: 'BERT_Base_FineTune',
    parameters: { model_type: 'BERT', learning_rate: 2e-5, epochs: 3, batch_size: 16 },
    metrics: { accuracy: 0.89, precision: 0.88, recall: 0.90 },
    artifactUri: 's3://mlflowpro-artifacts/experiments/sentiment/run_bert_1/artifacts/',
    status: 'completed',
  });
  await runRepository.save(run1Sentiment);

  const run2Sentiment = runRepository.create({
    experiment: sentimentExp,
    runName: 'RoBERTa_FineTune',
    parameters: { model_type: 'RoBERTa', learning_rate: 1e-5, epochs: 3, batch_size: 32 },
    metrics: { accuracy: 0.91, precision: 0.91, recall: 0.91 },
    artifactUri: 's3://mlflowpro-artifacts/experiments/sentiment/run_roberta_1/artifacts/',
    status: 'completed',
  });
  await runRepository.save(run2Sentiment);

  const run1Fraud = runRepository.create({
    experiment: fraudExp,
    runName: 'XGBoost_Default_Params',
    parameters: { booster: 'gbtree', n_estimators: 100, learning_rate: 0.1 },
    metrics: { auc_roc: 0.92, precision: 0.75, recall: 0.85 },
    artifactUri: 's3://mlflowpro-artifacts/experiments/fraud/run_xgb_1/artifacts/',
    status: 'completed',
  });
  await runRepository.save(run1Fraud);

  console.log('Runs seeded.');

  // 6. Create Datasets
  const customerReviewsDataset = datasetRepository.create({
    name: 'Customer Reviews',
    description: 'Collection of customer reviews for product sentiment analysis.',
    path: 's3://mlflowpro-data/customer_reviews_v1.csv',
    version: '1.0.0',
    owner: adminUser,
  });
  await datasetRepository.save(customerReviewsDataset);

  const transactionLogsDataset = datasetRepository.create({
    name: 'Transaction Logs',
    description: 'Anonymized transaction data for fraud detection.',
    path: 's3://mlflowpro-data/transaction_logs_v2.parquet',
    version: '2.1.0',
    owner: regularUser,
  });
  await datasetRepository.save(transactionLogsDataset);

  console.log('Datasets seeded.');

  // 7. Create Features
  const reviewTextFeature = featureRepository.create({
    name: 'review_text',
    description: 'Raw text of customer reviews.',
    dataType: 'string',
    sourceDataset: customerReviewsDataset,
    owner: adminUser,
  });
  await featureRepository.save(reviewTextFeature);

  const transactionAmountFeature = featureRepository.create({
    name: 'transaction_amount',
    description: 'Amount of the transaction.',
    dataType: 'float',
    sourceDataset: transactionLogsDataset,
    owner: regularUser,
  });
  await featureRepository.save(transactionAmountFeature);

  const transactionTimeFeature = featureRepository.create({
    name: 'transaction_time',
    description: 'Time of the transaction (hour of day).',
    dataType: 'integer',
    sourceDataset: transactionLogsDataset,
    owner: regularUser,
  });
  await featureRepository.save(transactionTimeFeature);

  console.log('Features seeded.');
  console.log('Database seeding complete!');
};
```