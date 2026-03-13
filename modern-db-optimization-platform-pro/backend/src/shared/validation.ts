```typescript
import { z } from 'zod';

export const passwordSchema = z.string().min(8, 'Password must be at least 8 characters long');

export const validate = (schema: z.AnyZodObject) => (req: any, res: any, next: any) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (error: any) {
    const errors = error.errors.map((err: any) => `${err.path.join('.')} - ${err.message}`);
    res.status(400).json({ success: false, message: 'Validation failed', errors });
  }
};
```