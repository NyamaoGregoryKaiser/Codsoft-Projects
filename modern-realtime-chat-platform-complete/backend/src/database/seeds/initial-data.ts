import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../users/user.entity';
import { Room, RoomType } from '../../chat/room.entity';
import { Message } from '../../chat/message.entity';
import { RoomMember } from '../../chat/room-member.entity';
import { typeOrmConfig } from '../typeorm-config';

async function seed() {
  const dataSource = new DataSource(typeOrmConfig);

  try {
    await dataSource.initialize();
    console.log('Data Source initialized!');

    const userRepository = dataSource.getRepository(User);
    const roomRepository = dataSource.getRepository(Room);
    const messageRepository = dataSource.getRepository(Message);
    const roomMemberRepository = dataSource.getRepository(RoomMember);

    // Clear existing data (optional, for development seeding)
    await roomMemberRepository.delete({});
    await messageRepository.delete({});
    await roomRepository.delete({});
    await userRepository.delete({});
    console.log('Existing data cleared.');

    // --- Create Users ---
    const hashedPassword1 = await bcrypt.hash('password123', 10);
    const hashedPassword2 = await bcrypt.hash('password456', 10);
    const hashedPassword3 = await bcrypt.hash('password789', 10);

    const user1 = userRepository.create({
      username: 'alice',
      email: 'alice@example.com',
      password: hashedPassword1,
      avatar: 'https://i.pravatar.cc/150?img=1',
    });
    const user2 = userRepository.create({
      username: 'bob',
      email: 'bob@example.com',
      password: hashedPassword2,
      avatar: 'https://i.pravatar.cc/150?img=2',
    });
    const user3 = userRepository.create({
      username: 'charlie',
      email: 'charlie@example.com',
      password: hashedPassword3,
      avatar: 'https://i.pravatar.cc/150?img=3',
    });

    await userRepository.save([user1, user2, user3]);
    console.log('Users created.');

    // --- Create Rooms ---
    const publicRoom = roomRepository.create({
      name: 'General Chat',
      type: RoomType.PUBLIC,
      creator: user1,
    });
    const privateRoom = roomRepository.create({
      name: 'Project Alpha',
      type: RoomType.PRIVATE,
      creator: user2,
    });
    const directChat = roomRepository.create({
      name: `DM: ${user1.username} & ${user2.username}`,
      type: RoomType.DIRECT,
      creator: user1,
    });

    await roomRepository.save([publicRoom, privateRoom, directChat]);
    console.log('Rooms created.');

    // --- Add Room Members ---
    const members = [
      roomMemberRepository.create({ room: publicRoom, user: user1 }),
      roomMemberRepository.create({ room: publicRoom, user: user2 }),
      roomMemberRepository.create({ room: publicRoom, user: user3 }),
      roomMemberRepository.create({ room: privateRoom, user: user2 }),
      roomMemberRepository.create({ room: privateRoom, user: user3 }),
      roomMemberRepository.create({ room: directChat, user: user1 }),
      roomMemberRepository.create({ room: directChat, user: user2 }),
    ];

    await roomMemberRepository.save(members);
    console.log('Room members added.');

    // --- Create Messages ---
    const messages = [
      messageRepository.create({
        sender: user1,
        room: publicRoom,
        content: 'Hello everyone in General Chat!',
      }),
      messageRepository.create({
        sender: user2,
        room: publicRoom,
        content: 'Hi Alice! How are you?',
      }),
      messageRepository.create({
        sender: user3,
        room: publicRoom,
        content: 'Welcome to the chat!',
      }),
      messageRepository.create({
        sender: user2,
        room: privateRoom,
        content: 'Meeting on Project Alpha tomorrow at 10 AM.',
      }),
      messageRepository.create({
        sender: user3,
        room: privateRoom,
        content: 'Got it, thanks Bob!',
      }),
      messageRepository.create({
        sender: user1,
        room: directChat,
        content: 'Hey Bob, checking in for our direct chat.',
      }),
      messageRepository.create({
        sender: user2,
        room: directChat,
        content: 'Hi Alice, all good here!',
      }),
    ];

    await messageRepository.save(messages);
    console.log('Messages created.');

    console.log('Seeding complete!');
  } catch (err) {
    console.error('Error during seeding:', err);
    process.exit(1);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('Data Source destroyed.');
    }
  }
}

seed();