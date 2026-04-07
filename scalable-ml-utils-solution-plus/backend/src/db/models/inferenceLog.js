```javascript
module.exports = (sequelize, DataTypes) => {
  const InferenceLog = sequelize.define('InferenceLog', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    model_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'models',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    request_payload: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    response_payload: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    status: {
      type: DataTypes.ENUM('success', 'error'),
      allowNull: false
    },
    duration_ms: {
      type: DataTypes.INTEGER,
      allowNull: true // Could be null if inference failed quickly
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'inference_logs',
    indexes: [
      {
        fields: ['model_id']
      },
      {
        fields: ['timestamp']
      }
    ]
  });

  InferenceLog.associate = (models) => {
    InferenceLog.belongsTo(models.Model, {
      foreignKey: 'model_id',
      as: 'model'
    });
  };

  return InferenceLog;
};
```