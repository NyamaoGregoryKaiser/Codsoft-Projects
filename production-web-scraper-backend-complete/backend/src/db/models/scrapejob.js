const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const ScrapeJob = sequelize.define('ScrapeJob', {
    id: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
      allowNull: false,
    },
    targetId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'targets',
        key: 'id',
      },
    },
    userId: { // User who created/owns the target, or triggered an immediate job
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    status: {
      type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'failed'),
      defaultValue: 'pending',
    },
    triggeredBy: { // Who triggered this specific job run (userId, 'system' for scheduled)
      type: DataTypes.STRING,
      allowNull: false,
    },
    scheduledJobId: { // Optional: Link to the BullMQ repeatable job ID if applicable
      type: DataTypes.STRING,
      allowNull: true,
    },
    result: { // Summary of the scrape result (e.g., number of items, specific status)
      type: DataTypes.JSONB,
      allowNull: true,
    },
    error: { // Error message if job failed
      type: DataTypes.JSONB,
      allowNull: true,
    },
  }, {
    timestamps: true,
    tableName: 'scrape_jobs',
  });

  ScrapeJob.associate = (models) => {
    ScrapeJob.belongsTo(models.Target, {
      foreignKey: 'targetId',
      as: 'target',
    });
    ScrapeJob.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
    ScrapeJob.hasMany(models.ScrapedData, {
      foreignKey: 'scrapeJobId',
      as: 'scrapedData',
      onDelete: 'CASCADE',
    });
  };

  return ScrapeJob;
};