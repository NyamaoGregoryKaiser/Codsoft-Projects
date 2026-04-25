```javascript
// backend/src/migrations/20230101000004-create-scraped-data-table.js
'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ScrapedData', {
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
      data: {
        type: Sequelize.JSONB,
        allowNull: false
      },
      scrapedAt: {
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
    await queryInterface.addIndex('ScrapedData', ['jobId']);
    await queryInterface.addIndex('ScrapedData', ['websiteId']);
    await queryInterface.addIndex('ScrapedData', ['scrapedAt']);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('ScrapedData');
  }
};
```