```typescript
import { Request, Response, NextFunction } from 'express';
import * as channelService from '../services/channelService';
import { logger } from '../config/logger';

export const createChannel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    const { name, description, isPrivate } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Channel name is required.' });
    }

    const newChannel = await channelService.createChannel(name, description, isPrivate || false, req.user.id);
    res.status(201).json(newChannel);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to create channel' });
    // next(error);
  }
};

export const getMyChannels = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    const channels = await channelService.getChannelsForUser(req.user.id);
    res.status(200).json(channels);
  } catch (error) {
    next(error);
  }
};

export const getChannelById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    const { id } = req.params;
    const channel = await channelService.getChannelDetails(id, req.user.id);
    res.status(200).json(channel);
  } catch (error: any) {
    if (error.message === 'Channel not found.' || error.message.includes('Access denied')) {
      return res.status(404).json({ message: error.message });
    }
    next(error);
  }
};

export const joinChannel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    const { id } = req.params; // Channel ID
    await channelService.joinChannel(id, req.user.id);
    res.status(200).json({ message: 'Successfully joined channel.' });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to join channel' });
    // next(error);
  }
};

export const leaveChannel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    const { id } = req.params; // Channel ID
    await channelService.leaveChannel(id, req.user.id);
    res.status(200).json({ message: 'Successfully left channel.' });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to leave channel' });
    // next(error);
  }
};

export const getPublicChannels = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    const publicChannels = await channelService.getPublicChannels(req.user.id);
    res.status(200).json(publicChannels);
  } catch (error) {
    next(error);
  }
};
```