```typescript
import { z } from 'zod';
import { ProductStatus } from '@prisma/client'; // Assuming ProductStatus is defined in Prisma

// Common schemas
const objectIdSchema = z.string().uuid('Invalid UUID format for ID'); // For Prisma UUIDs

// Auth Schemas
export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});

// Product Schemas
export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(3, 'Product name must be at least 3 characters long'),
    description: z.string().min(10, 'Product description must be at least 10 characters long'),
    price: z.number().positive('Price must be a positive number'),
    stock: z.number().int().min(0, 'Stock cannot be negative'),
    categoryId: objectIdSchema,
    imageUrl: z.string().url('Invalid image URL').optional(),
    status: z.nativeEnum(ProductStatus).default(ProductStatus.ACTIVE).optional(),
  }),
});

export const updateProductSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    name: z.string().min(3, 'Product name must be at least 3 characters long').optional(),
    description: z.string().min(10, 'Product description must be at least 10 characters long').optional(),
    price: z.number().positive('Price must be a positive number').optional(),
    stock: z.number().int().min(0, 'Stock cannot be negative').optional(),
    categoryId: objectIdSchema.optional(),
    imageUrl: z.string().url('Invalid image URL').optional(),
    status: z.nativeEnum(ProductStatus).optional(),
  }).partial(), // All fields are optional for update
});

export const getProductSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

export const listProductsSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/, "Page must be a number").transform(Number).default('1'),
    limit: z.string().regex(/^\d+$/, "Limit must be a number").transform(Number).default('10'),
    category: objectIdSchema.optional(),
    search: z.string().optional(),
    minPrice: z.string().regex(/^\d+(\.\d+)?$/, "Min price must be a number").transform(Number).optional(),
    maxPrice: z.string().regex(/^\d+(\.\d+)?$/, "Max price must be a number").optional(),
    sortBy: z.enum(['createdAt', 'price', 'name', 'stock']).default('createdAt').optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc').optional(),
    status: z.nativeEnum(ProductStatus).optional(),
  }).partial(),
});

// User Schemas (Example)
export const updateUserSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    firstName: z.string().min(1, 'First name is required').optional(),
    lastName: z.string().min(1, 'Last name is required').optional(),
    email: z.string().email('Invalid email address').optional(),
    role: z.enum(['USER', 'ADMIN']).optional(),
  }).partial(),
});

export const deleteUserSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});


// Category Schemas (Example)
export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(3, 'Category name must be at least 3 characters long'),
    description: z.string().optional(),
  }),
});

export const updateCategorySchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    name: z.string().min(3, 'Category name must be at least 3 characters long').optional(),
    description: z.string().optional(),
  }).partial(),
});

export const getCategorySchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

// Order Schemas (Example - highly simplified)
export const createOrderSchema = z.object({
  body: z.object({
    cartId: objectIdSchema, // Or directly pass items:
    addressId: objectIdSchema,
    paymentMethod: z.string().min(1, 'Payment method is required'),
    // products: z.array(z.object({
    //   productId: objectIdSchema,
    //   quantity: z.number().int().min(1, 'Quantity must be at least 1'),
    //   price: z.number().positive('Price must be positive')
    // }))
  }),
});

export const updateOrderStatusSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    status: z.enum(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
  }),
});
```