```javascript
/**
 * @file Initializes Sequelize and defines model associations.
 * @module models/index
 */

const { sequelize } = require('../config/database');
const logger = require('../utils/logger');

// Import models
const User = require('./userModel')(sequelize);
const Room = require('./roomModel')(sequelize);
const Message = require('./messageModel')(sequelize);

// Define associations
User.hasMany(Message, { foreignKey: 'senderId', as: 'sentMessages' });
Message.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });

Room.hasMany(Message, { foreignKey: 'roomId', as: 'messages' });
Message.belongsTo(Room, { foreignKey: 'roomId', as: 'room' });

// Define a many-to-many relationship for users in rooms
// This creates an intermediate table `UserRooms`
User.belongsToMany(Room, { through: 'UserRooms', as: 'rooms', foreignKey: 'userId' });
Room.belongsToMany(User, { through: 'UserRooms', as: 'members', foreignKey: 'roomId' });

// Add creator relationship for rooms
User.hasMany(Room, { foreignKey: 'creatorId', as: 'createdRooms' });
Room.belongsTo(User, { foreignKey: 'creatorId', as: 'creator' });


/**
 * Synchronizes all models with the database.
 * @async
 * @function syncModels
 * @param {boolean} [force=false] - If true, drops existing tables before recreating.
 * @returns {Promise<void>}
 */
const syncModels = async (force = false) => {
    try {
        await sequelize.sync({ force });
        logger.info(`Database & models synced! Force: ${force}`);
    } catch (error) {
        logger.error('Error syncing database models:', error);
        process.exit(1);
    }
};

module.exports = {
    sequelize,
    User,
    Room,
    Message,
    syncModels,
};
```