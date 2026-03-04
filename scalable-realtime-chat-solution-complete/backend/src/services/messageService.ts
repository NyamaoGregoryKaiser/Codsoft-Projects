```typescript
import { prisma } from '../config/prisma';
import { logger } from '../config/logger';

export const getChannelMessages = async (channelId: string, userId: string, take: number = 50, skip: number = 0) => {
  try {
    // First, ensure the user is a member of the channel
    const membership = await prisma.channelMembership.findUnique({
      where: {
        userId_channelId: {
          userId: userId,
          channelId: channelId,
        },
      },
    });

    if (!membership) {
      // Check if it's a public channel, in which case non-members might be able to see history (optional, currently restricted)
      const channel = await prisma.channel.findUnique({ where: { id: channelId } });
      if (!channel) {
        throw new Error('Channel not found.');
      }
      if (channel.isPrivate) {
        throw new Error('Access denied: You are not a member of this private channel.');
      }
      // If public and not a member, you could allow viewing, but for now we require membership for message history
      throw new Error('Access denied: You are not a member of this channel.');
    }

    const messages = await prisma.message.findMany({
      where: { channelId },
      orderBy: { createdAt: 'desc' }, // Latest messages first
      take: take,
      skip: skip,
      include: {
        sender: {
          select: { id: true, username: true },
        },
      },
    });
    // Reverse the array to have oldest messages at the top for display
    return messages.reverse();
  } catch (error) {
    logger.error(`Error fetching messages for channel ${channelId} by user ${userId}:`, error);
    throw error;
  }
};

export const createMessage = async (channelId: string, senderId: string, content: string) => {
  try {
    // Ensure the user is a member of the channel before allowing message creation
    const membership = await prisma.channelMembership.findUnique({
      where: {
        userId_channelId: {
          userId: senderId,
          channelId: channelId,
        },
      },
    });

    if (!membership) {
      throw new Error('You cannot send messages to a channel you are not a member of.');
    }

    const newMessage = await prisma.message.create({
      data: {
        channelId,
        senderId,
        content,
      },
      include: {
        sender: {
          select: { id: true, username: true },
        },
      },
    });
    logger.info(`Message sent in channel ${channelId} by ${senderId}`);
    return newMessage;
  } catch (error) {
    logger.error(`Error creating message in channel ${channelId} by user ${senderId}:`, error);
    throw error;
  }
};

export const updateMessage = async (messageId: string, userId: string, content: string) => {
  try {
    const existingMessage = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!existingMessage) {
      throw new Error('Message not found.');
    }
    if (existingMessage.senderId !== userId) {
      throw new Error('You can only edit your own messages.');
    }

    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: { content, updatedAt: new Date() },
      include: {
        sender: {
          select: { id: true, username: true },
        },
      },
    });
    logger.info(`Message ${messageId} updated by user ${userId}`);
    return updatedMessage;
  } catch (error) {
    logger.error(`Error updating message ${messageId} by user ${userId}:`, error);
    throw error;
  }
};

export const deleteMessage = async (messageId: string, userId: string) => {
  try {
    const existingMessage = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!existingMessage) {
      throw new Error('Message not found.');
    }
    if (existingMessage.senderId !== userId) {
      throw new Error('You can only delete your own messages.');
    }

    await prisma.message.delete({
      where: { id: messageId },
    });
    logger.info(`Message ${messageId} deleted by user ${userId}`);
    return { message: 'Message deleted successfully.' };
  } catch (error) {
    logger.error(`Error deleting message ${messageId} by user ${userId}:`, error);
    throw error;
  }
};
```