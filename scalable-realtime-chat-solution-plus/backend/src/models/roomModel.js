```javascript
/**
 * @file Defines the Room model.
 * @module models/roomModel
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Room = sequelize.define('Room', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                len: {
                    args: [3, 50],
                    msg: 'Room name must be between 3 and 50 characters.',
                },
            },
        },
        description: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: 'A general chat room.',
        },
        isPrivate: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false,
        },
        // Creator ID could be added for ownership
        creatorId: {
            type: DataTypes.UUID,
            allowNull: true, // Can be null for system-created rooms
            references: {
                model: 'Users',
                key: 'id',
            },
        }
    }, {
        timestamps: true,
        indexes: [
            { unique: true, fields: ['name'] },
        ],
    });

    // Room.associate = (models) => {
    //     Room.belongsToMany(models.User, { through: 'UserRooms', as: 'members' });
    //     Room.hasMany(models.Message, { foreignKey: 'roomId', as: 'messages' });
    // };

    return Room;
};
```