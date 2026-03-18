```javascript
module.exports = (sequelize, DataTypes) => {
  const Message = sequelize.define(
    'Message',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      chatRoomId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'chat_rooms', // This is the table name
          key: 'id',
        },
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users', // This is the table name
          key: 'id',
        },
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
    },
    {
      tableName: 'messages',
      timestamps: true,
      // Add indexes for foreign keys and timestamp for query optimization
      indexes: [
        {
          fields: ['chatRoomId'],
        },
        {
          fields: ['userId'],
        },
        {
          fields: ['createdAt'], // For retrieving latest messages efficiently
        },
      ],
    }
  );

  return Message;
};
```