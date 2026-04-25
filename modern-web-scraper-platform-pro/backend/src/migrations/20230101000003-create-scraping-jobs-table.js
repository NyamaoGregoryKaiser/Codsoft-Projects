```javascript
// backend/src/migrations/20230101000003-create-scraping-jobs-table.js
'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ScrapingJobs', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      websiteId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Websites',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      cronSchedule: {
        type: Sequelize.STRING,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('pending', 'running', 'completed', 'failed', 'stopped'),
        allowNull: false,
        defaultValue: 'pending'
      },
      lastRun: {
        type: Sequelize.DATE,
        allowNull: true
      },
      nextRun: {
        type: Sequelize.DATE,
        allowNull: true
      },
      selectorConfig: {
        type: Sequelize.JSONB,
        allowNull: false
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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
    await queryInterface.addIndex('ScrapingJobs', ['websiteId']);
    await queryInterface.addIndex('ScrapingJobs', ['userId']);
    await queryInterface.addIndex('ScrapingJobs', ['status']);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('ScrapingJobs');
  }
};
```