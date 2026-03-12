```javascript
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Metric = sequelize.define('Metric', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    applicationId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'applications',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    type: {
      type: DataTypes.ENUM('cpu', 'memory', 'request_latency', 'error_rate'),
      allowNull: false,
    },
    value: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW, // Default to current time, but allow sending specific timestamps
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'metrics',
    indexes: [
      {
        fields: ['applicationId'],
      },
      {
        fields: ['timestamp'],
      },
      {
        fields: ['applicationId', 'type', 'timestamp'],
        unique: false, // Not unique as there can be many metrics of same type over time
      },
    ],
  });

  Metric.associate = (models) => {
    Metric.belongsTo(models.Application, {
      foreignKey: 'applicationId',
      as: 'application',
    });
  };

  return Metric;
};
```