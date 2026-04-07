```javascript
module.exports = (sequelize, DataTypes) => {
  const Model = sequelize.define('Model', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    version: {
      type: DataTypes.STRING,
      defaultValue: '1.0.0'
    },
    description: {
      type: DataTypes.TEXT
    },
    type: {
      type: DataTypes.ENUM('classification', 'regression', 'clustering', 'other'),
      defaultValue: 'other',
      allowNull: false
    },
    endpoint_url: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isUrl: true
      }
    },
    owner_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    dataset_id: {
      type: DataTypes.UUID,
      references: {
        model: 'datasets',
        key: 'id'
      },
      onUpdate: 'SET NULL',
      onDelete: 'SET NULL'
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'models'
  });

  Model.associate = (models) => {
    Model.belongsTo(models.User, {
      foreignKey: 'owner_id',
      as: 'owner'
    });
    Model.belongsTo(models.Dataset, {
      foreignKey: 'dataset_id',
      as: 'dataset'
    });
    Model.hasMany(models.InferenceLog, {
      foreignKey: 'model_id',
      as: 'inferenceLogs'
    });
  };

  return Model;
};
```