```javascript
const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
  const Application = sequelize.define('Application', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true, // Application names should be unique for a user, but globally unique for simplicity here.
      validate: {
        len: {
          args: [3, 100],
          msg: 'Application name must be between 3 and 100 characters.',
        },
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    apiKey: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(), // Generate a UUID as an API key on creation
      allowNull: false,
      unique: true,
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
    tableName: 'applications',
    indexes: [
      {
        fields: ['userId', 'name'],
        unique: true, // Ensure a user cannot have two applications with the same name
      },
    ],
  });

  Application.associate = (models) => {
    Application.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'owner',
    });
    Application.hasMany(models.Metric, {
      foreignKey: 'applicationId',
      as: 'metrics',
      onDelete: 'CASCADE',
    });
    Application.hasMany(models.Alert, {
      foreignKey: 'applicationId',
      as: 'alerts',
      onDelete: 'CASCADE',
    });
  };

  return Application;
};
```