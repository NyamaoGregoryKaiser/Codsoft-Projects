```javascript
const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');
const logger = require('../config/logger');

const db = {};

db.sequelize = sequelize;
db.Sequelize = Sequelize;

db.User = require('./user.model')(sequelize, DataTypes);
db.ChatRoom = require('./chatroom.model')(sequelize, DataTypes);
db.Message = require('./message.model')(sequelize, DataTypes);

// Define relationships
// User - ChatRoom (Many-to-Many through UserChatRoom)
db.User.belongsToMany(db.ChatRoom, { through: 'UserChatRooms', foreignKey: 'userId', as: 'chatRooms' });
db.ChatRoom.belongsToMany(db.User, { through: 'UserChatRooms', foreignKey: 'chatRoomId', as: 'users' });

// User - Message (One-to-Many)
db.User.hasMany(db.Message, { foreignKey: 'userId', as: 'messages' });
db.Message.belongsTo(db.User, { foreignKey: 'userId', as: 'sender' });

// ChatRoom - Message (One-to-Many)
db.ChatRoom.hasMany(db.Message, { foreignKey: 'chatRoomId', as: 'messages' });
db.Message.belongsTo(db.ChatRoom, { foreignKey: 'chatRoomId', as: 'room' });

// Sync database - For development/testing, in production use migrations
// db.sequelize.sync({ alter: true }) // use { force: true } to drop tables
//   .then(() => logger.info('Database & tables created/updated!'))
//   .catch(err => logger.error('Error synchronizing database:', err));

module.exports = db;
```