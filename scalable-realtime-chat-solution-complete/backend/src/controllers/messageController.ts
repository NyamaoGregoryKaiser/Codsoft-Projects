```typescript
import { Request, Response, NextFunction } from 'express';
import * as messageService from '../services/messageService';
import { logger } from '../config/logger';
import { io } from '../server'; // Import the Socket.IO instance

export const getMessages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    const { channelId } = req.params;
    const take = parseInt(req.query.take as string || '50', 10);
    const skip = parseInt(req.query.skip as string || '0', 10);

    const messages = await messageService.getChannelMessages(channelId, req.user.id, take, skip);
    res.status(200).json(messages);
  } catch (error: any) {
    if (error.message.includes('Access denied') || error.message.includes('Channel not found')) {
      return res.status(403).json({ message: error.message });
    }
    next(error);
  }
};

export const sendMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    const { channelId } = req.params;
    const { content } = req.body;

    if (!content || content.trim() === '') {
      return res.status(400).json({ message: 'Message content cannot be empty.' });
    }

    const newMessage = await messageService.createMessage(channelId, req.user.id, content);

    // Emit message to the channel via Socket.IO
    io.to(channelId).emit('receiveMessage', newMessage);
    logger.info(`Message emitted to channel ${channelId}`);

    res.status(201).json(newMessage);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to send message' });
    // next(error);
  }
};

export const updateMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    const { messageId } = req.params;
    const { content } = req.body;

    if (!content || content.trim() === '') {
      return res.status(400).json({ message: 'Message content cannot be empty.' });
    }

    const updatedMessage = await messageService.updateMessage(messageId, req.user.id, content);

    // Emit updated message to the channel
    io.to(updatedMessage.channelId).emit('messageUpdated', updatedMessage);
    logger.info(`Message ${messageId} updated and emitted to channel ${updatedMessage.channelId}`);

    res.status(200).json(updatedMessage);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to update message' });
    // next(error);
  }
};

export const deleteMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    const { messageId } = req.params;

    const messageToDelete = await prisma.message.findUnique({
      where: { id: messageId },
      select: { channelId: true, senderId: true }
    });

    if (!messageToDelete) {
      return res.status(404).json({ message: 'Message not found.' });
    }

    const result = await messageService.deleteMessage(messageId, req.user.id);

    // Emit message deletion to the channel
    io.to(messageToDelete.channelId).emit('messageDeleted', { messageId, channelId: messageToDelete.channelId });
    logger.info(`Message ${messageId} deleted and emitted from channel ${messageToDelete.channelId}`);

    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to delete message' });
    // next(error);
  }
};
```