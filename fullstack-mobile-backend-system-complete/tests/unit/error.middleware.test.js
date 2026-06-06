```javascript
const httpStatus = require('http-status');
const { errorConverter, errorHandler } = require('../../src/middleware/error.middleware');
const ApiError = require('../../src/utils/ApiError');
const config = require('../../src/config');
const logger = require('../../src/utils/logger'); // Mock logger

jest.mock('../../src/utils/logger');

describe('Error Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      locals: {},
    };
    next = jest.fn();
    jest.clearAllMocks(); // Clear mock calls after each test
  });

  describe('errorConverter', () => {
    it('should return the same ApiError if it is already an ApiError', () => {
      const error = new ApiError(httpStatus.BAD_REQUEST, 'Test Error');
      errorConverter(error, req, res, next);
      expect(next).toHaveBeenCalledWith(error);
    });

    it('should convert an Error to ApiError (500 by default)', () => {
      const error = new Error('Generic Error');
      errorConverter(error, req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(ApiError));
      const convertedError = next.mock.calls[0][0];
      expect(convertedError.statusCode).toBe(httpStatus.INTERNAL_SERVER_ERROR);
      expect(convertedError.message).toBe('Generic Error');
      expect(convertedError.isOperational).toBe(false);
    });

    it('should convert an Error with statusCode to ApiError', () => {
      const error = new Error('Not Found');
      error.statusCode = httpStatus.NOT_FOUND;
      errorConverter(error, req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(ApiError));
      const convertedError = next.mock.calls[0][0];
      expect(convertedError.statusCode).toBe(httpStatus.NOT_FOUND);
      expect(convertedError.message).toBe('Not Found');
      expect(convertedError.isOperational).toBe(false);
    });

    it('should preserve stack trace if present in original error', () => {
      const error = new Error('Test Error');
      error.stack = 'Custom Stack Trace';
      errorConverter(error, req, res, next);
      const convertedError = next.mock.calls[0][0];
      expect(convertedError.stack).toBe('Custom Stack Trace');
    });
  });

  describe('errorHandler', () => {
    let originalEnv;

    beforeAll(() => {
      originalEnv = config.env;
    });

    afterAll(() => {
      config.env = originalEnv;
    });

    it('should send error response with status and message in development', () => {
      config.env = 'development';
      const error = new ApiError(httpStatus.BAD_REQUEST, 'Validation Error');
      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(httpStatus.BAD_REQUEST);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          code: httpStatus.BAD_REQUEST,
          message: 'Validation Error',
          stack: expect.any(String), // Stack trace should be present in dev
        })
      );
      expect(res.locals.errorMessage).toBe('Validation Error');
      expect(logger.error).toHaveBeenCalledWith(error);
    });

    it('should hide stack trace in production', () => {
      config.env = 'production';
      const error = new ApiError(httpStatus.BAD_REQUEST, 'Validation Error');
      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(httpStatus.BAD_REQUEST);
      expect(res.send).toHaveBeenCalledWith(
        expect.not.objectContaining({ stack: expect.any(String) }) // Stack should NOT be present in prod
      );
      expect(res.locals.errorMessage).toBe('Validation Error');
      expect(logger.error).not.toHaveBeenCalled(); // Logger only logs in dev
    });

    it('should send 500 and generic message for non-operational errors in production', () => {
      config.env = 'production';
      const error = new Error('Something bad happened'); // Non-operational error
      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(httpStatus.INTERNAL_SERVER_ERROR);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          code: httpStatus.INTERNAL_SERVER_ERROR,
          message: httpStatus[httpStatus.INTERNAL_SERVER_ERROR], // Generic 500 message
        })
      );
      expect(res.locals.errorMessage).toBe('Something bad happened');
    });

    it('should not call next()', () => {
      const error = new ApiError(httpStatus.BAD_REQUEST, 'Test Error');
      errorHandler(error, req, res, next);
      expect(next).not.toHaveBeenCalled();
    });
  });
});
```