```typescript
import { Router } from 'express';
import { databaseConnectionController, validateCreateConnection, validateConnectionId, validateUpdateConnection } from './database-connection.controller';
import { protect } from '../shared/auth-middleware';

const router = Router();

router.use(protect); // All routes in this module require authentication

router.post('/', validateCreateConnection, databaseConnectionController.createConnection);
router.get('/', databaseConnectionController.getConnections);
router.get('/:id', validateConnectionId, databaseConnectionController.getConnection);
router.put('/:id', validateUpdateConnection, databaseConnectionController.updateConnection);
router.delete('/:id', validateConnectionId, databaseConnectionController.deleteConnection);

export default router;
```