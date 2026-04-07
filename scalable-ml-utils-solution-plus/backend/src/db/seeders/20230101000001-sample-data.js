```javascript
'use strict';
const bcrypt = require('bcryptjs');
const config = require('../../config/config');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const { User, Dataset, Model, InferenceLog } = queryInterface.sequelize.models;

    // Create Admin User
    const adminPasswordHash = await bcrypt.hash(config.adminUser.password, 10);
    const adminUser = await queryInterface.bulkInsert('users', [{
      id: Sequelize.UUIDV4,
      username: config.adminUser.username,
      email: config.adminUser.email,
      password: adminPasswordHash,
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date()
    }], { returning: true });

    const adminId = adminUser[0].id; // Get the ID of the newly created admin user

    // Create Regular User
    const userPasswordHash = await bcrypt.hash('userpassword', 10);
    const regularUser = await queryInterface.bulkInsert('users', [{
      id: Sequelize.UUIDV4,
      username: 'testuser',
      email: 'user@example.com',
      password: userPasswordHash,
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date()
    }], { returning: true });

    const userId = regularUser[0].id; // Get the ID of the newly created regular user

    // Create Datasets
    const dataset1 = await queryInterface.bulkInsert('datasets', [{
      id: Sequelize.UUIDV4,
      name: 'Customer Churn Data',
      description: 'Dataset for predicting customer churn in a telecom company.',
      source_url: 'https://example.com/churn_data.csv',
      schema_preview: {
        features: ['tenure', 'monthly_charges', 'total_charges', 'gender'],
        target: 'churn'
      },
      owner_id: adminId,
      createdAt: new Date(),
      updatedAt: new Date()
    }], { returning: true });
    const dataset1Id = dataset1[0].id;

    const dataset2 = await queryInterface.bulkInsert('datasets', [{
      id: Sequelize.UUIDV4,
      name: 'House Price Prediction Data',
      description: 'Dataset for predicting house prices based on various features.',
      source_url: 'https://example.com/housing_data.csv',
      schema_preview: {
        features: ['sq_ft', 'num_bedrooms', 'zip_code'],
        target: 'price'
      },
      owner_id: userId,
      createdAt: new Date(),
      updatedAt: new Date()
    }], { returning: true });
    const dataset2Id = dataset2[0].id;

    // Create Models
    const model1 = await queryInterface.bulkInsert('models', [{
      id: Sequelize.UUIDV4,
      name: 'Churn Predictor v1.0',
      version: '1.0.0',
      description: 'A logistic regression model to predict customer churn.',
      type: 'classification',
      endpoint_url: 'https://ml-service.example.com/predict/churn',
      owner_id: adminId,
      dataset_id: dataset1Id,
      createdAt: new Date(),
      updatedAt: new Date()
    }], { returning: true });
    const model1Id = model1[0].id;

    const model2 = await queryInterface.bulkInsert('models', [{
      id: Sequelize.UUIDV4,
      name: 'House Price Estimator v2.1',
      version: '2.1.0',
      description: 'A Random Forest Regressor model for house price estimation.',
      type: 'regression',
      endpoint_url: 'https://ml-service.example.com/predict/house-price',
      owner_id: userId,
      dataset_id: dataset2Id,
      createdAt: new Date(),
      updatedAt: new Date()
    }], { returning: true });
    const model2Id = model2[0].id;

    // Create Inference Logs
    await queryInterface.bulkInsert('inference_logs', [{
      id: Sequelize.UUIDV4,
      model_id: model1Id,
      request_payload: { tenure: 12, monthly_charges: 70, total_charges: 840, gender: 'male' },
      response_payload: { prediction: 0.2, churn_probability: 0.2, class: 'no-churn' },
      status: 'success',
      duration_ms: 150,
      timestamp: new Date()
    }, {
      id: Sequelize.UUIDV4,
      model_id: model2Id,
      request_payload: { sq_ft: 1500, num_bedrooms: 3, zip_code: '90210' },
      response_payload: { prediction: 550000, price_range: [500000, 600000] },
      status: 'success',
      duration_ms: 220,
      timestamp: new Date()
    }], {});
  },

  down: async (queryInterface, Sequelize) => {
    // Delete data in reverse order of foreign key dependencies
    await queryInterface.bulkDelete('inference_logs', null, {});
    await queryInterface.bulkDelete('models', null, {});
    await queryInterface.bulkDelete('datasets', null, {});
    await queryInterface.bulkDelete('users', null, {});
  }
};
```