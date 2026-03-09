```javascript
'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('ScrapingJobs', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
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
      startUrl: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      cssSelectors: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: [],
      },
      schedule: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED'),
        defaultValue: 'PENDING',
        allowNull: false,
      },
      lastRunAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      nextRunAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      runCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      proxyEnabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      jsRendering: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('ScrapingJobs');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_ScrapingJobs_status";');
  }
};
```