```typescript
import Joi from 'joi';
import { UserRole } from '@prisma/client';

// Auth Validation
export const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  role: Joi.string().valid(UserRole.USER, UserRole.ADMIN).default(UserRole.USER),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

// Scraping Job Validation
export const selectorSchema = Joi.object({
  name: Joi.string().required(),
  selector: Joi.string().required(),
});

export const createJobSchema = Joi.object({
  name: Joi.string().min(3).max(255).required(),
  url: Joi.string().uri().required(),
  cssSelectors: Joi.array().items(selectorSchema).min(1).required(),
  cronSchedule: Joi.string().optional().allow(null, ''),
  isActive: Joi.boolean().default(true),
});

export const updateJobSchema = Joi.object({
  name: Joi.string().min(3).max(255).optional(),
  url: Joi.string().uri().optional(),
  cssSelectors: Joi.array().items(selectorSchema).min(1).optional(),
  cronSchedule: Joi.string().optional().allow(null, ''),
  isActive: Joi.boolean().optional(),
}).min(1); // At least one field must be provided for update

// Pagination / List options
export const paginationSchema = Joi.object({
  limit: Joi.number().integer().min(1).max(100).default(10),
  offset: Joi.number().integer().min(0).default(0),
});
```