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
      unique: true,
      validate: {
        notEmpty: { msg: 'Project name cannot be empty.' },
        len: {
          args: [3, 100],
          msg: 'Project name must be between 3 and 100 characters.'
        }
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('active', 'completed', 'on-hold', 'cancelled'),
      defaultValue: 'active',
      allowNull: false,
    },
    ownerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users', // refers to table name
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
      onDelete: 'CASCADE',
    });
  };

  return Project;
};
```