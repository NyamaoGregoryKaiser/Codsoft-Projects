```typescript
import express from 'express';
import { User } from '../models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';

const router = express.Router();

router.post('/register',
    body('email').isEmail().withMessage('Invalid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { email, password } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await User.create({ email, password: hashedPassword });
      res.status(201).json({ message: 'User registered successfully', user: user.toJSON() });
    } catch (error) {
      res.status(500).json({ error: 'Error registering user' });
    }
  });

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!);
      res.json({ token });
    } catch (error) {
      res.status(500).json({ error: 'Error logging in' });
    }
  });

export default router;
```