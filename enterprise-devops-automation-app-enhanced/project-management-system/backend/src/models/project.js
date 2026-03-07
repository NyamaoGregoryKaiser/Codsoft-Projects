```javascript
module.exports = (sequelize, DataTypes) => {
  const Project = sequelize.define('Project', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      trim: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('pending', 'active', 'completed', 'cancelled'),
      defaultValue: 'pending',
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    ownerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
  }, {
    tableName: 'projects',
    timestamps: true,
  });

  Project.associate = (models) => {
    Project.belongsTo(models.User, {
      foreignKey: 'ownerId',
      as: 'owner',
    });
    Project.hasMany(models.Task, {
      foreignKey: 'projectId',
      as: 'tasks',
    });
    Project.belongsToMany(models.User, {
      through: 'UserProject',
      as: 'members',
      foreignKey: 'projectId',
    });
  };

  return Project;
};
```