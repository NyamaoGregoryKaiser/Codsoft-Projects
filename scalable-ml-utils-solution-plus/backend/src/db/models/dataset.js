```javascript
module.exports = (sequelize, DataTypes) => {
  const Dataset = sequelize.define('Dataset', {
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
    description: {
      type: DataTypes.TEXT
    },
    source_url: {
      type: DataTypes.STRING,
      validate: {
        isUrl: true
      }
    },
    schema_preview: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
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
    tableName: 'datasets'
  });

  Dataset.associate = (models) => {
    Dataset.belongsTo(models.User, {
      foreignKey: 'owner_id',
      as: 'owner'
    });
    Dataset.hasMany(models.Model, {
      foreignKey: 'dataset_id',
      as: 'models'
    });
  };

  return Dataset;
};
```