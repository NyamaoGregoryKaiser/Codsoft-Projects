```javascript
'use strict';

const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const hashedPassword = await bcrypt.hash('password123', 10);
    const userId1 = uuidv4();
    const userId2 = uuidv4();

    await queryInterface.bulkInsert('users', [
      {
        id: userId1,
        username: 'adminuser',
        email: 'admin@example.com',
        passwordHash: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: userId2,
        username: 'testuser',
        email: 'test@example.com',
        passwordHash: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ], {});

    const app1Id = uuidv4();
    const app2Id = uuidv4();
    const app3Id = uuidv4();

    await queryInterface.bulkInsert('applications', [
      {
        id: app1Id,
        userId: userId1,
        name: 'WebApp-Prod',
        description: 'Production web application monitoring.',
        apiKey: uuidv4(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: app2Id,
        userId: userId1,
        name: 'Backend-Service-Dev',
        description: 'Development backend service monitoring.',
        apiKey: uuidv4(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: app3Id,
        userId: userId2,
        name: 'MobileApp-API',
        description: 'API for mobile application.',
        apiKey: uuidv4(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ], {});

    // Seed some metrics for WebApp-Prod (app1Id)
    const metricsData = [];
    const now = new Date();
    for (let i = 0; i < 24; i++) { // Last 24 hours
      const timestamp = new Date(now.getTime() - i * 3600 * 1000); // Hourly data
      metricsData.push({
        id: uuidv4(),
        applicationId: app1Id,
        type: 'cpu',
        value: parseFloat((Math.random() * (0.8 - 0.1) + 0.1).toFixed(2)), // 10-80% CPU usage
        timestamp: timestamp,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      metricsData.push({
        id: uuidv4(),
        applicationId: app1Id,
        type: 'memory',
        value: parseFloat((Math.random() * (500 - 100) + 100).toFixed(0)), // 100-500 MB memory usage
        timestamp: timestamp,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      metricsData.push({
        id: uuidv4(),
        applicationId: app1Id,
        type: 'request_latency',
        value: parseFloat((Math.random() * (500 - 50) + 50).toFixed(0)), // 50-500 ms latency
        timestamp: timestamp,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      metricsData.push({
        id: uuidv4(),
        applicationId: app1Id,
        type: 'error_rate',
        value: parseFloat((Math.random() * (5 - 0) + 0).toFixed(1)), // 0-5% error rate
        timestamp: timestamp,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Add some "spike" data for an alert trigger example
    const spikeTime = new Date(now.getTime() - 2 * 3600 * 1000); // 2 hours ago
    metricsData.push({
      id: uuidv4(),
      applicationId: app1Id,
      type: 'cpu',
      value: 0.95, // High CPU usage
      timestamp: spikeTime,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    metricsData.push({
      id: uuidv4(),
      applicationId: app1Id,
      type: 'error_rate',
      value: 12.5, // High error rate
      timestamp: spikeTime,
      createdAt: new Date(),
      updatedAt: new Date(),
    });


    await queryInterface.bulkInsert('metrics', metricsData, {});

    await queryInterface.bulkInsert('alerts', [
      {
        id: uuidv4(),
        applicationId: app1Id,
        metricType: 'cpu',
        thresholdValue: 0.90, // 90% CPU
        operator: '>',
        status: 'active',
        message: 'CPU usage exceeded 90%',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        applicationId: app1Id,
        metricType: 'error_rate',
        thresholdValue: 10, // 10% error rate
        operator: '>',
        status: 'active',
        message: 'Error rate exceeded 10%',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        applicationId: app2Id,
        metricType: 'memory',
        thresholdValue: 700, // 700 MB
        operator: '>',
        status: 'active',
        message: 'Memory usage exceeded 700MB',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ], {});

  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('alerts', null, {});
    await queryInterface.bulkDelete('metrics', null, {});
    await queryInterface.bulkDelete('applications', null, {});
    await queryInterface.bulkDelete('users', null, {});
  }
};
```