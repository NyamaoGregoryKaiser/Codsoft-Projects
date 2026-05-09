import { Order, OrderStatus, Prisma } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';
import prisma from '../../config/database';
import { ApiError } from '../../middleware/error.middleware';
import { PaginationMeta } from '../../types';

interface OrderItemData {
  productId: string;
  quantity: number;
}

interface OrderCreateData {
  userId: string;
  items: OrderItemData[];
  shippingAddress?: string;
}

interface OrderUpdateData {
  status?: OrderStatus;
  shippingAddress?: string;
}

/**
 * Create a new order.
 * @param data
 * @returns {Order}
 */
export const createOrder = async (data: OrderCreateData): Promise<Order> => {
  return prisma.$transaction(async (tx) => {
    // 1. Validate user
    const user = await tx.user.findUnique({ where: { id: data.userId } });
    if (!user) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
    }

    let totalAmount = new Prisma.Decimal(0);
    const orderItemsData: Prisma.OrderItemCreateManyOrderInput[] = [];

    // 2. Validate products and reduce stock
    for (const item of data.items) {
      const product = await tx.product.findUnique({ where: { id: item.productId } });

      if (!product) {
        throw new ApiError(StatusCodes.NOT_FOUND, `Product with ID ${item.productId} not found`);
      }
      if (product.stock < item.quantity) {
        throw new ApiError(StatusCodes.BAD_REQUEST, `Not enough stock for product ${product.name}`);
      }

      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });

      totalAmount = totalAmount.plus(new Prisma.Decimal(product.price).times(item.quantity));
      orderItemsData.push({
        productId: item.productId,
        quantity: item.quantity,
        priceAtOrder: product.price,
      });
    }

    // 3. Create the order
    const order = await tx.order.create({
      data: {
        userId: data.userId,
        totalAmount,
        shippingAddress: data.shippingAddress,
        status: OrderStatus.PENDING,
        items: {
          createMany: {
            data: orderItemsData,
          },
        },
      },
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    return order;
  });
};

/**
 * Get all orders with pagination.
 * @param offset
 * @param limit
 * @param userId (optional, for filtering orders by user)
 * @returns {{ orders: Order[], meta: PaginationMeta }}
 */
export const getAllOrders = async (offset: number, limit: number, userId?: string): Promise<{ orders: Order[], meta: PaginationMeta }> => {
  const whereClause: Prisma.OrderWhereInput = userId ? { userId } : {};

  const [orders, total] = await prisma.$transaction([
    prisma.order.findMany({
      where: whereClause,
      skip: offset,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, email: true, name: true } },
        items: { include: { product: true } },
      },
    }),
    prisma.order.count({ where: whereClause }),
  ]);

  return {
    orders,
    meta: {
      total,
      limit,
      offset,
      page: Math.floor(offset / limit) + 1,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get order by ID.
 * @param orderId
 * @returns {Order}
 */
export const getOrderById = async (orderId: string, userId?: string): Promise<Order> => {
  const order = await prisma.order.findUnique({
    where: { id: orderId, ...(userId && { userId }) }, // Restrict by userId if provided
    include: {
      user: { select: { id: true, email: true, name: true } },
      items: { include: { product: true } },
    },
  });
  if (!order) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Order not found');
  }
  return order;
};

/**
 * Update order by ID.
 * @param orderId
 * @param data
 * @returns {Order}
 */
export const updateOrderById = async (orderId: string, data: OrderUpdateData): Promise<Order> => {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Order not found');
  }

  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data,
    include: {
      user: { select: { id: true, email: true, name: true } },
      items: { include: { product: true } },
    },
  });
  return updatedOrder;
};

/**
 * Delete order by ID.
 * @param orderId
 * @returns {void}
 */
export const deleteOrderById = async (orderId: string): Promise<void> => {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Order not found');
  }

  // Restore product stock before deleting the order
  await prisma.$transaction(async (tx) => {
    const orderItems = await tx.orderItem.findMany({ where: { orderId } });
    for (const item of orderItems) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      });
    }
    // Delete order items and then the order
    await tx.orderItem.deleteMany({ where: { orderId } });
    await tx.order.delete({ where: { id: orderId } });
  });
};