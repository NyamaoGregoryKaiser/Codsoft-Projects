const logger = require('@utils/logger');
const winston = require('winston');

// Mock the winston logger methods
const mockConsoleTransport = {
  log: jest.fn(),
};

// Replace winston's createLogger with a mock
jest.mock('winston', () => {
  const original = jest.requireActual('winston');
  return {
    ...original,
    createLogger: jest.fn(() => {
      return {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
        http: jest.fn(),
        add: jest.fn(),
        remove: jest.fn(),
        transports: {
          Console: jest.fn(() => mockConsoleTransport),
        },
        exceptionHandlers: [],
        rejectionHandlers: [],
      };
    }),
    format: {
      ...original.format,
      printf: jest.fn(() => (info) => info), // Simplify printf for testing
    },
    transports: {
      File: jest.fn(),
      Console: jest.fn(),
    }
  };
});


describe('Logger Utility', () => {
  const mockLoggerInstance = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    http: jest.fn(),
    add: jest.fn(),
    remove: jest.fn(),
    exceptionHandlers: [],
    rejectionHandlers: [],
  };

  beforeAll(() => {
    // Override createLogger to return our mock instance
    winston.createLogger.mockReturnValue(mockLoggerInstance);
    // Reload logger to use the mocked createLogger
    jest.resetModules();
    const newLogger = require('@utils/logger');
    Object.assign(logger, newLogger); // Update the imported logger object
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should log an info message', () => {
    logger.info('This is an info message');
    expect(mockLoggerInstance.info).toHaveBeenCalledWith('This is an info message');
  });

  it('should log an error message with error object', () => {
    const error = new Error('Test Error');
    logger.error('An error occurred', error);
    expect(mockLoggerInstance.error).toHaveBeenCalledWith('An error occurred', error);
  });

  it('should log a debug message', () => {
    logger.debug('Debug info here');
    expect(mockLoggerInstance.debug).toHaveBeenCalledWith('Debug info here');
  });

  it('should log an HTTP message', () => {
    logger.http('GET /api/data');
    expect(mockLoggerInstance.http).toHaveBeenCalledWith('GET /api/data');
  });

  it('should not add console transport in production environment', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    jest.resetModules(); // Clear module cache
    require('@utils/logger'); // Re-require to re-evaluate env condition
    expect(mockLoggerInstance.add).not.toHaveBeenCalledWith(expect.any(winston.transports.Console));
    process.env.NODE_ENV = originalEnv; // Restore original environment
  });

  it('should add console transport in development environment', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    jest.resetModules();
    require('@utils/logger');
    expect(mockLoggerInstance.add).toHaveBeenCalledWith(expect.any(winston.transports.Console));
    process.env.NODE_ENV = originalEnv;
  });
});
```

#### `backend/tests/integration/routes/auth.integration.test.js`
```javascript