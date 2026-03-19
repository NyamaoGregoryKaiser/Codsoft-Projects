```typescript
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { Conversation, Message, User } from '@prisma/client';
import { ConversationWithParticipantsAndMessages } from './types/conversation.types';

@Injectable()
export class ConversationService {
  constructor(private prisma: PrismaService) {}

  async createConversation(
    creatorId: string,
    createConversationDto: CreateConversationDto,
  ): Promise<ConversationWithParticipantsAndMessages> {
    const { participantIds, name } = createConversationDto;

    // Ensure all participants exist
    const uniqueParticipantIds = Array.from(new Set([...participantIds, creatorId]));
    const existingUsers = await this.prisma.user.findMany({
      where: { id: { in: uniqueParticipantIds } },
      select: { id: true },
    });

    if (existingUsers.length !== uniqueParticipantIds.length) {
      throw new BadRequestException('One or more participants do not exist.');
    }

    if (uniqueParticipantIds.length === 1 && !name) {
      throw new BadRequestException('Cannot create a conversation with only one participant without a name.');
    }

    // Check for existing 1-on-1 conversation
    if (uniqueParticipantIds.length === 2 && !name) {
      const [user1Id, user2Id] = uniqueParticipantIds.sort(); // Sort to handle (A,B) vs (B,A) consistency
      const existingPrivateConversation = await this.prisma.conversation.findFirst({
        where: {
          isGroup: false,
          participants: {
            every: {
              userId: { in: [user1Id, user2Id] },
            },
          },
        },
        include: {
          participants: true,
        },
      });

      if (existingPrivateConversation && existingPrivateConversation.participants.length === 2) {
        return this.getConversationById(existingPrivateConversation.id); // Return existing private chat
      }
    }

    const conversation = await this.prisma.conversation.create({
      data: {
        name: name,
        isGroup: uniqueParticipantIds.length > 2 || !!name, // If more than 2 or has a name, it's a group
        participants: {
          create: uniqueParticipantIds.map((userId) => ({
            userId,
          })),
        },
      },
      include: {
        participants: {
          include: {
            user: { select: { id: true, username: true, email: true } },
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: { select: { id: true, username: true } },
            readBy: { select: { userId: true } },
          },
          take: 0, // No messages on creation
        },
      },
    });

    return conversation;
  }

  async getUserConversations(userId: string): Promise<ConversationWithParticipantsAndMessages[]> {
    return this.prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            userId: userId,
          },
        },
      },
      include: {
        participants: {
          include: {
            user: { select: { id: true, username: true, email: true } },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1, // Get only the latest message for preview
          include: {
            sender: { select: { id: true, username: true } },
            readBy: { select: { userId: true } },
          },
        },
      },
      orderBy: {
        updatedAt: 'desc', // Order by last message or conversation update
      },
    });
  }

  async getConversationById(conversationId: string): Promise<ConversationWithParticipantsAndMessages> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
          include: {
            user: { select: { id: true, username: true, email: true } },
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: { select: { id: true, username: true } },
            readBy: { select: { userId: true } },
          },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException(`Conversation with ID ${conversationId} not found.`);
    }

    return conversation;
  }

  async addParticipant(conversationId: string, addMemberDto: AddMemberDto, currentUserId: string): Promise<Conversation> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { participants: true },
    });

    if (!conversation) {
      throw new NotFoundException(`Conversation with ID ${conversationId} not found.`);
    }

    if (!conversation.isGroup) {
      throw new BadRequestException('Cannot add members to a private chat directly. Create a new group.');
    }

    const isCurrentUserParticipant = conversation.participants.some((p) => p.userId === currentUserId);
    if (!isCurrentUserParticipant) {
      throw new UnauthorizedException('You are not a member of this conversation.');
    }

    const userToAdd = await this.prisma.user.findUnique({ where: { id: addMemberDto.userId } });
    if (!userToAdd) {
      throw new BadRequestException(`User with ID ${addMemberDto.userId} not found.`);
    }

    const isAlreadyParticipant = conversation.participants.some((p) => p.userId === addMemberDto.userId);
    if (isAlreadyParticipant) {
      throw new BadRequestException('User is already a participant in this conversation.');
    }

    return this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        participants: {
          create: { userId: addMemberDto.userId },
        },
        updatedAt: new Date(), // Mark conversation as updated
      },
      include: { participants: true },
    });
  }

  async removeParticipant(conversationId: string, userIdToRemove: string, currentUserId: string): Promise<Conversation> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { participants: true },
    });

    if (!conversation) {
      throw new NotFoundException(`Conversation with ID ${conversationId} not found.`);
    }

    if (!conversation.isGroup) {
      throw new BadRequestException('Cannot remove members from a private chat.');
    }

    const isCurrentUserParticipant = conversation.participants.some((p) => p.userId === currentUserId);
    if (!isCurrentUserParticipant) {
      throw new UnauthorizedException('You are not a member of this conversation.');
    }

    const isUserToRemoveParticipant = conversation.participants.some((p) => p.userId === userIdToRemove);
    if (!isUserToRemoveParticipant) {
      throw new BadRequestException('User is not a participant in this conversation.');
    }

    if (conversation.participants.length <= 2) {
      throw new BadRequestException('A group must have at least two participants.');
    }

    return this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        participants: {
          deleteMany: { userId: userIdToRemove },
        },
        updatedAt: new Date(),
      },
      include: { participants: true },
    });
  }

  async deleteConversation(conversationId: string, currentUserId: string): Promise<Conversation> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { participants: true },
    });

    if (!conversation) {
      throw new NotFoundException(`Conversation with ID ${conversationId} not found.`);
    }

    const isCurrentUserParticipant = conversation.participants.some((p) => p.userId === currentUserId);
    if (!isCurrentUserParticipant) {
      throw new UnauthorizedException('You are not authorized to delete this conversation.');
    }

    // Delete messages and participants first due to foreign key constraints
    await this.prisma.message.deleteMany({ where: { conversationId } });
    await this.prisma.conversationParticipant.deleteMany({ where: { conversationId } });

    return this.prisma.conversation.delete({
      where: { id: conversationId },
    });
  }
}
```