```typescript
import { Router } from 'express';
import { getMessages, sendMessage, updateMessage, deleteMessage } from '../controllers/messageController';
import { protect } from '../middleware/auth';

const router = Router();

router.get('/:channelId', protect, getMessages);
router.post('/:channelId', protect, sendMessage);
router.put('/:messageId', protect, updateMessage);
router.delete('/:messageId', protect, deleteMessage);

export default router;
```