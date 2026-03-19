```typescript
import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SendMessageDto } from './dto/send-message.dto';
import { Message } from '@prisma/client';

@Injectable()
export class MessageService {
  constructor(private prisma: PrismaService) {}

  async sendMessage(senderId: string, sendMessageDto: SendMessageDto): Promise<Message> {
    const { conversationId, content } = sendMessageDto;

    // Verify sender is a participant of the conversation
    const participant = await this.prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId: senderId,
      },
    });

    if (!participant) {
      throw new UnauthorizedException('You are not a participant of this conversation.');
    }

    const message = await this.prisma.message.create({
      data: {
        conversationId,
        senderId,
        content,
        readBy: {
          create: {
            userId: senderId, // Sender automatically reads their own message
          },
        },
      },
      include: {
        sender: { select: { id: true, username: true } },
        readBy: { select: { userId: true } },
      },
    });

    // Update conversation's updatedAt to reflect new message
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return message;
  }

  async getMessages(conversationId: string, userId: string): Promise<Message[]> {
    // Verify user is a participant of the conversation
    const participant = await this.prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId: userId,
      },
    });

    if (!participant) {
      throw new UnauthorizedException('You are not a participant of this conversation.');
    }

    return this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: { select: { id: true, username: true } },
        readBy: { select: { userId: true } },
      },
    });
  }

  async markMessageAsRead(messageId: string, userId: string): Promise<Message> {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: {
        conversation: {
          include: {
            participants: true,
          },
        },
        readBy: true,
      },
    });

    if (!message) {
      throw new NotFoundException(`Message with ID ${messageId} not found.`);
    }

    // Check if user is a participant of the conversation
    const isParticipant = message.conversation.participants.some((p) => p.userId === userId);
    if (!isParticipant) {
      throw new UnauthorizedException('You are not a participant of this conversation.');
    }

    // Check if message is already read by user
    const alreadyRead = message.readBy.some((read) => read.userId === userId);
    if (alreadyRead) {
      return this.prisma.message.findUnique({
        where: { id: messageId },
        include: { sender: true, readBy: true },
      }); // No update needed
    }

    return this.prisma.message.update({
      where: { id: messageId },
      data: {
        readBy: {
          create: { userId: userId },
        },
      },
      include: {
        sender: { select: { id: true, username: true } },
        readBy: { select: { userId: true } },
      },
    });
  }
}
```