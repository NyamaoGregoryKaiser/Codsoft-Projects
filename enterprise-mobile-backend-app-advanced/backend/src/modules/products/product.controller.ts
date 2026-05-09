import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import * as productService from './product.service';
import { ApiResponse, PaginatedResponse } from '../../types';

export const createProduct = async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
  try {
    const product = await productService.createProduct(req.body);
    res.status(StatusCodes.CREATED).json({
      success: true,
      message: 'Product created successfully',
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllProducts = async (req: Request, res: Response<PaginatedResponse<any>>, next: NextFunction) => {
  try {
    const offset = parseInt(req.query.offset as string) || 0;
    const limit = parseInt(req.query.limit as string) || 10;
    const { products, meta } = await productService.getAllProducts(offset, limit);
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Products retrieved successfully',
      data: { data: products, meta },
    });
  } catch (error) {
    next(error);
  }
};

export const getProductById = async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
  try {
    const product = await productService.getProductById(req.params.productId);
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Product retrieved successfully',
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProductById = async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
  try {
    const product = await productService.updateProductById(req.params.productId, req.body);
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Product updated successfully',
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProductById = async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
  try {
    await productService.deleteProductById(req.params.productId);
    res.status(StatusCodes.NO_CONTENT).json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};