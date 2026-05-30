```javascript
module.exports = (sequelize, DataTypes) => {
  const Task = sequelize.define('Task', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Task title cannot be empty.' },
        len: {
          args: [3, 255],
          msg: 'Task title must be between 3 and 255 characters.'
        }
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('pending', 'in-progress', 'completed', 'blocked'),
      defaultValue: 'pending',
      allowNull: false,
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high'),
      defaultValue: 'medium',
      allowNull: false,
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    projectId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'projects',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    assigneeId: {
      type: DataTypes.UUID,
      allowNull: true, // Tasks can be unassigned
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'SET NULL',
    },
  }, {
    tableName: 'tasks',
    timestamps: true,
  });

  Task.associate = (models) => {
    Task.belongsTo(models.Project, {
      foreignKey: 'projectId',
      as: 'project',
    });
    Task.belongsTo(models.User, {
      foreignKey: 'assigneeId',
      as: 'assignee',
    });
  };

  return Task;
};
```