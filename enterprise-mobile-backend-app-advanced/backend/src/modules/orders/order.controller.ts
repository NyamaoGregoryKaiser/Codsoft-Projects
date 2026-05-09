import { Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import * as orderService from './order.service';
import { ApiResponse, AuthenticatedRequest, PaginatedResponse, UserRole } from '../../types';

export const createOrder = async (req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) => {
  try {
    const { items, shippingAddress, userId: requestedUserId } = req.body;
    let userIdToUse = req.user!.id; // Default to authenticated user

    // If admin, they can create an order for another user
    if (req.user?.role === UserRole.ADMIN && requestedUserId) {
      userIdToUse = requestedUserId;
    }

    const order = await orderService.createOrder({ userId: userIdToUse, items, shippingAddress });
    res.status(StatusCodes.CREATED).json({
      success: true,
      message: 'Order created successfully',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllOrders = async (req: AuthenticatedRequest, res: Response<PaginatedResponse<any>>, next: NextFunction) => {
  try {
    const offset = parseInt(req.query.offset as string) || 0;
    const limit = parseInt(req.query.limit as string) || 10;
    let filterUserId: string | undefined = undefined;

    // Users can only see their own orders, Admins can see all or filter by user
    if (req.user?.role === UserRole.USER) {
      filterUserId = req.user.id;
    } else if (req.user?.role === UserRole.ADMIN && req.query.userId) {
      filterUserId = req.query.userId as string;
    }

    const { orders, meta } = await orderService.getAllOrders(offset, limit, filterUserId);
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Orders retrieved successfully',
      data: { data: orders, meta },
    });
  } catch (error) {
    next(error);
  }
};

export const getOrderById = async (req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) => {
  try {
    const { orderId } = req.params;
    let filterUserId: string | undefined = undefined;

    // Users can only see their own orders
    if (req.user?.role === UserRole.USER) {
      filterUserId = req.user.id;
    }

    const order = await orderService.getOrderById(orderId, filterUserId);
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Order retrieved successfully',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

export const updateOrderById = async (req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) => {
  try {
    const { orderId } = req.params;
    // Only admins can update any order, or a user can potentially update their own (e.g., shipping address for pending)
    // For simplicity, this is currently admin-only.
    // A more complex logic would involve checking if req.user.id matches order.userId for certain fields.
    const updatedOrder = await orderService.updateOrderById(orderId, req.body);
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Order updated successfully',
      data: updatedOrder,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteOrderById = async (req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) => {
  try {
    const { orderId } = req.params;
    await orderService.deleteOrderById(orderId);
    res.status(StatusCodes.NO_CONTENT).json({
      success: true,
      message: 'Order deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};