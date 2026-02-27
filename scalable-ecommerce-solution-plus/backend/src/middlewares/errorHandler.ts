import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';

export class ApiError extends Error {
    statusCode: number;
    isOperational: boolean;

    constructor(statusCode: number, message: string, isOperational = true, stack = '') {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

const errorHandler = (err: Error | ApiError, req: Request, res: Response, next: NextFunction) => {
    let statusCode = 500;
    let message = 'An unexpected error occurred.';

    if (err instanceof ApiError) {
        statusCode = err.statusCode;
        message = err.message;
        if (!err.isOperational) {
            logger.error(`Non-operational error: ${err.message}`, err);
        } else {
            logger.warn(`Operational error: ${err.message}`);
        }
    } else {
        logger.error(`Unhandled error: ${err.message}`, err);
    }

    // Don't send stack trace in production
    const response = {
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    };

    res.status(statusCode).send(response);
};

export default errorHandler;