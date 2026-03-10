import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(255, 'Product name too long'),
  description: z.string().min(1, 'Description is required'),
  price: z.number().positive('Price must be a positive number'),
  stock: z.number().int().nonnegative('Stock must be a non-negative integer'),
});

export const getProductSchema = z.object({
  productId: z.string().uuid('Invalid product ID format'),
});

export const updateProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(255, 'Product name too long').optional(),
  description: z.string().min(1, 'Description is required').optional(),
  price: z.number().positive('Price must be a positive number').optional(),
  stock: z.number().int().nonnegative('Stock must be a non-negative integer').optional(),
}).partial(); // All fields are optional for update

export type CreateProductBody = z.infer<typeof createProductSchema>;
export type UpdateProductBody = z.infer<typeof updateProductSchema>;