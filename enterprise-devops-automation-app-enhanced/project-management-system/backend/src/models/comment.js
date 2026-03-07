```javascript
module.exports = (sequelize, DataTypes) => {
  const Comment = sequelize.define('Comment', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    taskId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'tasks',
        key: 'id',
      },
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      trim: true,
    },
  }, {
    tableName: 'comments',
    timestamps: true,
  });

  Comment.associate = (models) => {
    Comment.belongsTo(models.Task, {
      foreignKey: 'taskId',
      as: 'task',
    });
    Comment.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
  };

  return Comment;
};
```