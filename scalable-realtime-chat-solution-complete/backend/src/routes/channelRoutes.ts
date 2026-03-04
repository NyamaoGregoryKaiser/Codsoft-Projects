```typescript
import { Router } from 'express';
import { createChannel, getMyChannels, getChannelById, joinChannel, leaveChannel, getPublicChannels } from '../controllers/channelController';
import { protect } from '../middleware/auth';

const router = Router();

router.post('/', protect, createChannel);
router.get('/my', protect, getMyChannels);
router.get('/public', protect, getPublicChannels);
router.get('/:id', protect, getChannelById);
router.post('/:id/join', protect, joinChannel);
router.post('/:id/leave', protect, leaveChannel);

export default router;
```