```typescript
import express, { Router, Request, Response } from 'express';
import { getPost, getPosts, createPost, updatePost, deletePost } from '../controllers/posts';

const router: Router = express.Router();

router.get('/', getPosts);
router.get('/:id', getPost);
router.post('/', createPost);
router.put('/:id', updatePost);
router.delete('/:id', deletePost);

export { router as postsRouter };
```