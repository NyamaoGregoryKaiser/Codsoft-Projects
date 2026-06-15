import logger from '../../src/utils/logger';
import winston from 'winston';

describe('Logger Utility', () => {
  let logSpy: jest.SpyInstance;
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    logSpy = jest.spyOn(winston.transports.Console.prototype, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('should log info messages in development', () => {
    process.env.NODE_ENV = 'development';
    logger.info('Test info message');
    expect(logSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'info',
        message: 'Test info message',
      }),
      expect.any(Function)
    );
  });

  it('should log error messages', () => {
    logger.error('Test error message', new Error('Something went wrong'));
    expect(logSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'error',
        message: 'Test error message',
        stack: expect.any(String),
      }),
      expect.any(Function)
    );
  });

  it('should not log debug messages in production', () => {
    process.env.NODE_ENV = 'production';
    logger.debug('Test debug message');
    // Ensure the console transport (mocked by logSpy) was not called for debug
    // In actual implementation, winston might still process it but not pass to this transport
    // A more robust test would inspect file output or internal winston state
    expect(logSpy).not.toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'debug',
        message: 'Test debug message',
      }),
      expect.any(Function)
    );
  });

  it('should log debug messages in development', () => {
    process.env.NODE_ENV = 'development';
    logger.debug('Test debug message');
    expect(logSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'debug',
        message: 'Test debug message',
      }),
      expect.any(Function)
    );
  });
});
```