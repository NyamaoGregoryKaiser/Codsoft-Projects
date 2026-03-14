```javascript
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs'); // For hashing passwords
const User = require('./models/User');
const Room = require('./models/Room');
const Message = require('./models/Message');
const connectDB = require('./config/db');
const logger = require('./config/winston');

dotenv.config({ path: './.env' });

connectDB();

const seedData = async () => {
  try {
    // Clear existing data
    await User.deleteMany();
    await Room.deleteMany();
    await Message.deleteMany();
    logger.info('Existing data cleared.');

    // Create users
    const user1Password = await bcrypt.hash('password123', 10);
    const user2Password = await bcrypt.hash('password123', 10);
    const user3Password = await bcrypt.hash('password123', 10);

    const user1 = await User.create({
      username: 'alice',
      email: 'alice@example.com',
      password: user1Password,
    });

    const user2 = await User.create({
      username: 'bob',
      email: 'bob@example.com',
      password: user2Password,
    });

    const user3 = await User.create({
      username: 'charlie',
      email: 'charlie@example.com',
      password: user3Password,
    });
    logger.info('Users created.');

    // Create rooms
    const generalRoom = await Room.create({
      name: 'General',
      isPrivate: false,
      members: [user1._id, user2._id, user3._id],
    });

    const devTeamRoom = await Room.create({
      name: 'Dev Team',
      isPrivate: true,
      members: [user1._id, user2._id],
    });

    const privateChatAliceBob = await Room.create({
      name: 'Alice & Bob',
      isPrivate: true,
      members: [user1._id, user2._id],
    });
    logger.info('Rooms created.');

    // Update users with their rooms
    await User.findByIdAndUpdate(user1._id, { $addToSet: { rooms: [generalRoom._id, devTeamRoom._id, privateChatAliceBob._id] } });
    await User.findByIdAndUpdate(user2._id, { $addToSet: { rooms: [generalRoom._id, devTeamRoom._id, privateChatAliceBob._id] } });
    await User.findByIdAndUpdate(user3._id, { $addToSet: { rooms: [generalRoom._id] } });
    logger.info('Users updated with room memberships.');

    // Create messages
    await Message.create([
      { room: generalRoom._id, sender: user1._id, content: 'Hello everyone in General!' },
      { room: generalRoom._id, sender: user2._id, content: 'Hi Alice, how are you?' },
      { room: generalRoom._id, sender: user3._id, content: 'Good morning, all!' },
      { room: devTeamRoom._id, sender: user1._id, content: 'Dev team, let\'s discuss the new feature.' },
      { room: devTeamRoom._id, sender: user2._id, content: 'Agreed, I have some ideas.' },
      { room: privateChatAliceBob._id, sender: user1._id, content: 'Hey Bob, quick question about our project.' },
      { room: privateChatAliceBob._id, sender: user2._id, content: 'Sure Alice, what\'s up?' },
    ]);
    logger.info('Messages created.');

    logger.info('Database seeded successfully!');
    process.exit();
  } catch (error) {
    logger.error(`Error seeding database: ${error.message}`);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await User.deleteMany();
    await Room.deleteMany();
    await Message.deleteMany();
    logger.info('All data destroyed!');
    process.exit();
  } catch (error) {
    logger.error(`Error destroying data: ${error.message}`);
    process.exit(1);
  }
};

if (process.argv[2] === '-d') {
  destroyData();
} else {
  seedData();
}
```