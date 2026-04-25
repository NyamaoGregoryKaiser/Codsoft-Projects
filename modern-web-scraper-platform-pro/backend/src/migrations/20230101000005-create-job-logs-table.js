```javascript
// backend/src/migrations/20230101000005-create-job-logs-table.js
'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('JobLogs', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      jobId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'ScrapingJobs',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      level: {
        type: Sequelize.ENUM('info', 'warn', 'error'),
        allowNull: false,
        defaultValue: 'info'
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      timestamp: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
    await queryInterface.addIndex('JobLogs', ['jobId']);
    await queryInterface.addIndex('JobLogs', ['timestamp']);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('JobLogs');
  }
};
```