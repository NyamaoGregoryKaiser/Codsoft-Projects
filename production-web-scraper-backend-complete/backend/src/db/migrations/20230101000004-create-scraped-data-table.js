const { DataTypes } = require('sequelize');

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('scraped_data', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      scrapeJobId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'scrape_jobs',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      targetId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'targets',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      data: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('scraped_data');
  },
};