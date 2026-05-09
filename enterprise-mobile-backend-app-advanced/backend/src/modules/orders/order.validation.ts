import { z } from 'zod';
import { OrderStatus } from '@prisma/client';

const createOrderSchema = z.object({
  body: z.object({
    userId: z.string().uuid('Invalid user ID format').optional(), // Optional for authenticated users, required for admin creating for another
    items: z.array(z.object({
      productId: z.string().uuid('Invalid product ID format'),
      quantity: z.number().int().min(1, 'Quantity must be at least 1'),
    })).min(1, 'Order must contain at least one item'),
    shippingAddress: z.string().min(5, 'Shipping address is required').optional(),
  }),
});

const updateOrderSchema = z.object({
  params: z.object({
    orderId: z.string().uuid('Invalid order ID format'),
  }),
  body: z.object({
    status: z.nativeEnum(OrderStatus).optional(),
    shippingAddress: z.string().min(5, 'Shipping address is required').optional(),
  }).partial(),
});

const getOrderSchema = z.object({
  params: z.object({
    orderId: z.string().uuid('Invalid order ID format'),
  }),
});

const deleteOrderSchema = z.object({
  params: z.object({
    orderId: z.string().uuid('Invalid order ID format'),
  }),
});

export { createOrderSchema, updateOrderSchema, getOrderSchema, deleteOrderSchema };