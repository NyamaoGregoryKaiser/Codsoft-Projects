```javascript
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      username: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      passwordHash: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    await queryInterface.createTable('applications', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      apiKey: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4, // Default value to generate UUID
        allowNull: false,
        unique: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    // Add unique constraint for userId and name in applications table
    await queryInterface.addConstraint('applications', {
      fields: ['userId', 'name'],
      type: 'unique',
      name: 'unique_user_application_name'
    });

    await queryInterface.createTable('metrics', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      applicationId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'applications',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      type: {
        type: Sequelize.ENUM('cpu', 'memory', 'request_latency', 'error_rate'),
        allowNull: false,
      },
      value: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      timestamp: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    // Add indexes for query optimization on metrics
    await queryInterface.addIndex('metrics', ['applicationId']);
    await queryInterface.addIndex('metrics', ['timestamp']);
    await queryInterface.addIndex('metrics', ['applicationId', 'type', 'timestamp']);


    await queryInterface.createTable('alerts', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      applicationId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'applications',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      metricType: {
        type: Sequelize.ENUM('cpu', 'memory', 'request_latency', 'error_rate'),
        allowNull: false,
      },
      thresholdValue: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      operator: {
        type: Sequelize.ENUM('>', '<', '>=', '<=', '='),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('active', 'triggered', 'resolved', 'disabled'),
        allowNull: false,
        defaultValue: 'active',
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      triggeredAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      resolvedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    // Add indexes for alerts
    await queryInterface.addIndex('alerts', ['applicationId']);
    await queryInterface.addIndex('alerts', ['applicationId', 'metricType', 'status']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('alerts');
    await queryInterface.dropTable('metrics');
    await queryInterface.removeConstraint('applications', 'unique_user_application_name');
    await queryInterface.dropTable('applications');
    await queryInterface.dropTable('users');
    // Drop ENUM types if necessary, though not strictly required as tables are dropped
    // await queryInterface.sequelize.query('DROP TYPE "enum_metrics_type";');
    // await queryInterface.sequelize.query('DROP TYPE "enum_alerts_metricType";');
    // await queryInterface.sequelize.query('DROP TYPE "enum_alerts_operator";');
    // await queryInterface.sequelize.query('DROP TYPE "enum_alerts_status";');
  }
};
```