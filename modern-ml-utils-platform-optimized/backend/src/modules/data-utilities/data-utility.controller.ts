import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../shared/utils/catchAsync';
import * as dataUtilityService from './data-utility.service';
import ApiError from '../../shared/errors/ApiError';

export const oneHotEncode = catchAsync(async (req: Request, res: Response) => {
  const { data, column } = req.body;

  if (!Array.isArray(data) || data.length === 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Input data must be a non-empty array.');
  }
  if (!column || typeof column !== 'string') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Specify a valid column name for encoding.');
  }

  const encodedData = dataUtilityService.oneHotEncode(data, column);
  res.send({ originalData: data, encodedData });
});

export const minMaxScale = catchAsync(async (req: Request, res: Response) => {
  const { data, column } = req.body;

  if (!Array.isArray(data) || data.length === 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Input data must be a non-empty array.');
  }
  if (!column || typeof column !== 'string') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Specify a valid column name for scaling.');
  }

  const scaledData = dataUtilityService.minMaxScale(data, column);
  res.send({ originalData: data, scaledData });
});