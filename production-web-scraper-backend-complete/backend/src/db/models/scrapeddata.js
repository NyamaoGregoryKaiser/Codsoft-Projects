const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const ScrapedData = sequelize.define('ScrapedData', {
    id: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
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
    },
    targetId: { // Denormalized for easier querying
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'targets',
        key: 'id',
      },
    },
    data: { // The actual scraped data, stored as JSONB for schema flexibility
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
  }, {
    timestamps: true,
    tableName: 'scraped_data',
  });

  ScrapedData.associate = (models) => {
    ScrapedData.belongsTo(models.ScrapeJob, {
      foreignKey: 'scrapeJobId',
      as: 'scrapeJob',
    });
    ScrapedData.belongsTo(models.Target, {
      foreignKey: 'targetId',
      as: 'target',
    });
  };

  return ScrapedData;
};