import { z } from 'zod';

const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(3, 'Product name must be at least 3 characters long'),
    description: z.string().optional(),
    price: z.number().positive('Price must be a positive number'),
    stock: z.number().int().min(0, 'Stock cannot be negative'),
  }),
});

const updateProductSchema = z.object({
  params: z.object({
    productId: z.string().uuid('Invalid product ID format'),
  }),
  body: z.object({
    name: z.string().min(3, 'Product name must be at least 3 characters long').optional(),
    description: z.string().optional(),
    price: z.number().positive('Price must be a positive number').optional(),
    stock: z.number().int().min(0, 'Stock cannot be negative').optional(),
  }).partial(),
});

const getProductSchema = z.object({
  params: z.object({
    productId: z.string().uuid('Invalid product ID format'),
  }),
});

const deleteProductSchema = z.object({
  params: z.object({
    productId: z.string().uuid('Invalid product ID format'),
  }),
});

export { createProductSchema, updateProductSchema, getProductSchema, deleteProductSchema };