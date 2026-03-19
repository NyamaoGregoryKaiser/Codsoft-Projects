```typescript
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // Clear existing data (optional, for clean re-seeding)
  await prisma.messageReadBy.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversationParticipant.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.user.deleteMany();
  await prisma.onlineStatus.deleteMany();

  // Create users
  const hashedPassword1 = await bcrypt.hash('password123', 10);
  const user1 = await prisma.user.create({
    data: {
      username: 'alice',
      email: 'alice@example.com',
      password: hashedPassword1,
      onlineStatus: { create: { isOnline: false } },
    },
  });

  const hashedPassword2 = await bcrypt.hash('password123', 10);
  const user2 = await prisma.user.create({
    data: {
      username: 'bob',
      email: 'bob@example.com',
      password: hashedPassword2,
      onlineStatus: { create: { isOnline: false } },
    },
  });

  const hashedPassword3 = await bcrypt.hash('password123', 10);
  const user3 = await prisma.user.create({
    data: {
      username: 'charlie',
      email: 'charlie@example.com',
      password: hashedPassword3,
      onlineStatus: { create: { isOnline: false } },
    },
  });

  console.log('Users created:', { user1, user2, user3 });

  // Create a private conversation between Alice and Bob
  const privateConversation = await prisma.conversation.create({
    data: {
      isGroup: false,
      participants: {
        create: [{ userId: user1.id }, { userId: user2.id }],
      },
    },
  });

  // Create a group conversation
  const groupConversation = await prisma.conversation.create({
    data: {
      name: 'Team Alpha',
      isGroup: true,
      participants: {
        create: [{ userId: user1.id }, { userId: user2.id }, { userId: user3.id }],
      },
    },
  });

  console.log('Conversations created:', { privateConversation, groupConversation });

  // Send messages in private conversation
  const msg1 = await prisma.message.create({
    data: {
      conversationId: privateConversation.id,
      senderId: user1.id,
      content: 'Hey Bob, how are you?',
      readBy: {
        create: [{ userId: user1.id }], // Alice reads her own message
      },
    },
  });

  const msg2 = await prisma.message.create({
    data: {
      conversationId: privateConversation.id,
      senderId: user2.id,
      content: 'Hi Alice! I am good, thanks. You?',
      readBy: {
        create: [{ userId: user2.id }], // Bob reads his own message
      },
    },
  });

  await prisma.messageReadBy.create({
    data: {
      messageId: msg1.id,
      userId: user2.id, // Bob reads Alice's message
    },
  });

  // Send messages in group conversation
  await prisma.message.create({
    data: {
      conversationId: groupConversation.id,
      senderId: user1.id,
      content: 'Hello Team Alpha!',
      readBy: {
        create: [{ userId: user1.id }],
      },
    },
  });

  await prisma.message.create({
    data: {
      conversationId: groupConversation.id,
      senderId: user3.id,
      content: 'Hey everyone!',
      readBy: {
        create: [{ userId: user3.id }],
      },
    },
  });

  console.log('Messages created.');
  console.log('Seeding finished.');
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