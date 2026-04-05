const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const Target = sequelize.define('Target', {
    id: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      trim: true,
    },
    url: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isUrl: true,
      },
    },
    selectors: {
      type: DataTypes.JSONB, // Stores key-value pairs of CSS selectors
      allowNull: false,
      defaultValue: {},
    },
    schedule: {
      type: DataTypes.STRING, // Cron string, e.g., "0 * * * *" for hourly
      allowNull: true,
    },
  }, {
    timestamps: true,
    tableName: 'targets',
  });

  Target.associate = (models) => {
    Target.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
    Target.hasMany(models.ScrapeJob, {
      foreignKey: 'targetId',
      as: 'scrapeJobs',
      onDelete: 'CASCADE',
    });
    Target.hasMany(models.ScrapedData, {
      foreignKey: 'targetId',
      as: 'scrapedData',
      onDelete: 'CASCADE',
    });
  };

  return Target;
};