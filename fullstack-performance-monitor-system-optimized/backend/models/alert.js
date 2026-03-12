```javascript
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Alert = sequelize.define('Alert', {
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
    metricType: {
      type: DataTypes.ENUM('cpu', 'memory', 'request_latency', 'error_rate'),
      allowNull: false,
    },
    thresholdValue: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    operator: {
      type: DataTypes.ENUM('>', '<', '>=', '<=', '='),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('active', 'triggered', 'resolved', 'disabled'),
      allowNull: false,
      defaultValue: 'active',
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    triggeredAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    resolvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
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
    tableName: 'alerts',
    indexes: [
      {
        fields: ['applicationId'],
      },
      {
        fields: ['applicationId', 'metricType', 'status'],
      },
    ],
  });

  Alert.associate = (models) => {
    Alert.belongsTo(models.Application, {
      foreignKey: 'applicationId',
      as: 'application',
    });
  };

  return Alert;
};
```