```javascript
/**
 * @file Defines the Message model.
 * @module models/messageModel
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Message = sequelize.define('Message', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false,
            validate: {
                notEmpty: {
                    msg: 'Message content cannot be empty.',
                },
                len: {
                    args: [1, 5000], // Example: messages up to 5000 characters
                    msg: 'Message content must be between 1 and 5000 characters.',
                },
            },
        },
        // Foreign key for the user who sent the message
        senderId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'Users', // Refers to the 'Users' table
                key: 'id',
            },
        },
        // Foreign key for the room where the message was sent
        roomId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'Rooms', // Refers to the 'Rooms' table
                key: 'id',
            },
        },
        // Timestamps are automatically managed by Sequelize, createdAt and updatedAt
    }, {
        timestamps: true,
        indexes: [
            { fields: ['roomId', 'createdAt'] }, // For efficient message retrieval by room
            { fields: ['senderId'] },
        ]
    });

    // Message.associate = (models) => {
    //     Message.belongsTo(models.User, { foreignKey: 'senderId', as: 'sender' });
    //     Message.belongsTo(models.Room, { foreignKey: 'roomId', as: 'room' });
    // };

    return Message;
};
```