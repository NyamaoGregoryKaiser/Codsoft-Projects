```typescript
import { prisma } from '../config/prisma';
import { logger } from '../config/logger';

export const createChannel = async (name: string, description: string | undefined, isPrivate: boolean, creatorId: string) => {
  try {
    const newChannel = await prisma.channel.create({
      data: {
        name,
        description,
        isPrivate,
        creatorId,
        memberships: {
          create: {
            userId: creatorId,
          },
        },
      },
    });
    logger.info(`Channel created: ${newChannel.name} by user ${creatorId}`);
    return newChannel;
  } catch (error: any) {
    logger.error(`Error creating channel ${name} by user ${creatorId}:`, error);
    if (error.code === 'P2002') {
      throw new Error('Channel with this name already exists.');
    }
    throw new Error('Could not create channel.');
  }
};

export const getChannelsForUser = async (userId: string) => {
  try {
    const channels = await prisma.channel.findMany({
      where: {
        OR: [
          { creatorId: userId }, // Channels created by the user
          {
            memberships: {
              some: {
                userId: userId,
              },
            },
          },
        ],
      },
      include: {
        creator: {
          select: { username: true },
        },
        _count: {
          select: { memberships: true },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
    return channels.map(channel => ({
      ...channel,
      memberCount: channel._count.memberships,
    }));
  } catch (error) {
    logger.error(`Error fetching channels for user ${userId}:`, error);
    throw new Error('Could not fetch channels.');
  }
};

export const getChannelDetails = async (channelId: string, userId: string) => {
  try {
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
      include: {
        creator: {
          select: { id: true, username: true },
        },
        memberships: {
          include: {
            user: {
              select: { id: true, username: true },
            },
          },
        },
      },
    });

    if (!channel) {
      throw new Error('Channel not found.');
    }

    // Check if user is a member or if it's a public channel
    const isMember = channel.memberships.some(membership => membership.userId === userId);
    if (channel.isPrivate && !isMember) {
      throw new Error('Access denied: You are not a member of this private channel.');
    }

    return {
      ...channel,
      members: channel.memberships.map(m => m.user),
    };
  } catch (error) {
    logger.error(`Error fetching channel details for ${channelId} by user ${userId}:`, error);
    throw error;
  }
};

export const joinChannel = async (channelId: string, userId: string) => {
  try {
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      throw new Error('Channel not found.');
    }
    if (channel.isPrivate) {
      throw new Error('Cannot join a private channel directly. Invitation required.');
    }

    const membership = await prisma.channelMembership.create({
      data: {
        userId: userId,
        channelId: channelId,
      },
    });
    logger.info(`User ${userId} joined channel ${channelId}`);
    return membership;
  } catch (error: any) {
    logger.error(`Error joining channel ${channelId} by user ${userId}:`, error);
    if (error.code === 'P2002') {
      throw new Error('User is already a member of this channel.');
    }
    throw error;
  }
};

export const leaveChannel = async (channelId: string, userId: string) => {
  try {
    const membership = await prisma.channelMembership.delete({
      where: {
        userId_channelId: {
          userId: userId,
          channelId: channelId,
        },
      },
    });
    logger.info(`User ${userId} left channel ${channelId}`);
    return membership;
  } catch (error: any) {
    logger.error(`Error leaving channel ${channelId} by user ${userId}:`, error);
    if (error.code === 'P2025') {
      throw new Error('User is not a member of this channel.');
    }
    throw new Error('Could not leave channel.');
  }
};

export const getPublicChannels = async (userId: string) => {
  try {
    const publicChannels = await prisma.channel.findMany({
      where: {
        isPrivate: false,
        NOT: {
          memberships: {
            some: {
              userId: userId
            }
          }
        }
      },
      include: {
        creator: {
          select: { username: true }
        },
        _count: {
          select: { memberships: true }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    return publicChannels.map(channel => ({
      ...channel,
      memberCount: channel._count.memberships
    }));
  } catch (error) {
    logger.error(`Error fetching public channels for user ${userId}:`, error);
    throw new Error('Could not fetch public channels.');
  }
};
```