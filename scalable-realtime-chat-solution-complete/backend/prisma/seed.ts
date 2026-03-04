```typescript
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial data...');

  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create Users
  const user1 = await prisma.user.upsert({
    where: { username: 'alice' },
    update: {},
    create: {
      username: 'alice',
      email: 'alice@example.com',
      password: hashedPassword,
    },
  });

  const user2 = await prisma.user.upsert({
    where: { username: 'bob' },
    update: {},
    create: {
      username: 'bob',
      email: 'bob@example.com',
      password: hashedPassword,
    },
  });

  const user3 = await prisma.user.upsert({
    where: { username: 'charlie' },
    update: {},
    create: {
      username: 'charlie',
      email: 'charlie@example.com',
      password: hashedPassword,
    },
  });

  console.log('Users created:', { user1: user1.username, user2: user2.username, user3: user3.username });

  // Create Channels
  const generalChannel = await prisma.channel.upsert({
    where: { name: 'general' },
    update: {},
    create: {
      name: 'general',
      description: 'General discussion channel',
      isPrivate: false,
      creatorId: user1.id, // User1 created this
    },
  });

  const devChannel = await prisma.channel.upsert({
    where: { name: 'development' },
    update: {},
    create: {
      name: 'development',
      description: 'Discussion for developers',
      isPrivate: false,
      creatorId: user1.id, // User1 created this
    },
  });

  const privateChat = await prisma.channel.upsert({
    where: { name: `private_${user2.username}_${user3.username}` }, // Unique name for private chat
    update: {},
    create: {
      name: `private_${user2.username}_${user3.username}`, // Example private chat name
      description: 'Private chat between Bob and Charlie',
      isPrivate: true,
      creatorId: user2.id, // User2 created this private channel
    },
  });

  console.log('Channels created:', { general: generalChannel.name, dev: devChannel.name, private: privateChat.name });

  // Add Users to Channels (Memberships)
  await prisma.channelMembership.upsert({
    where: { userId_channelId: { userId: user1.id, channelId: generalChannel.id } },
    update: {},
    create: { userId: user1.id, channelId: generalChannel.id },
  });
  await prisma.channelMembership.upsert({
    where: { userId_channelId: { userId: user2.id, channelId: generalChannel.id } },
    update: {},
    create: { userId: user2.id, channelId: generalChannel.id },
  });
  await prisma.channelMembership.upsert({
    where: { userId_channelId: { userId: user3.id, channelId: generalChannel.id } },
    update: {},
    create: { userId: user3.id, channelId: generalChannel.id },
  });
  
  await prisma.channelMembership.upsert({
    where: { userId_channelId: { userId: user1.id, channelId: devChannel.id } },
    update: {},
    create: { userId: user1.id, channelId: devChannel.id },
  });
  await prisma.channelMembership.upsert({
    where: { userId_channelId: { userId: user2.id, channelId: devChannel.id } },
    update: {},
    create: { userId: user2.id, channelId: devChannel.id },
  });

  await prisma.channelMembership.upsert({
    where: { userId_channelId: { userId: user2.id, channelId: privateChat.id } },
    update: {},
    create: { userId: user2.id, channelId: privateChat.id },
  });
  await prisma.channelMembership.upsert({
    where: { userId_channelId: { userId: user3.id, channelId: privateChat.id } },
    update: {},
    create: { userId: user3.id, channelId: privateChat.id },
  });

  console.log('Users added to channels.');

  // Create initial messages
  await prisma.message.create({
    data: {
      content: 'Hello everyone in general!',
      senderId: user1.id,
      channelId: generalChannel.id,
    },
  });
  await prisma.message.create({
    data: {
      content: 'Hi Alice! How are you?',
      senderId: user2.id,
      channelId: generalChannel.id,
    },
  });
  await prisma.message.create({
    data: {
      content: 'Welcome to the dev channel!',
      senderId: user1.id,
      channelId: devChannel.id,
    },
  });
  await prisma.message.create({
    data: {
      content: 'Hey Charlie, testing private chat!',
      senderId: user2.id,
      channelId: privateChat.id,
    },
  });

  console.log('Initial messages created.');
  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```