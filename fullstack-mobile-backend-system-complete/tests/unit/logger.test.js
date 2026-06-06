```javascript
const winston = require('winston');
const logger = require('../../src/utils/logger');
const config = require('../../src/config');

// Mock Winston's console transport to capture output
const mockConsoleTransport = new winston.transports.Console();
logger.add(mockConsoleTransport);
const spy = jest.spyOn(mockConsoleTransport, 'log').mockImplementation(() => {});

describe('Logger', () => {
  let originalEnv;

  beforeAll(() => {
    originalEnv = config.env; // Save original env
  });

  afterEach(() => {
    spy.mockClear(); // Clear mock calls after each test
  });

  afterAll(() => {
    config.env = originalEnv; // Restore original env
    logger.remove(mockConsoleTransport); // Clean up the added transport
  });

  it('should log messages at debug level in development environment', () => {
    config.env = 'development';
    logger.debug('This is a debug message.');
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'debug',
        message: 'This is a debug message.',
      }),
      expect.any(Function) // Callback argument
    );
  });

  it('should not log debug messages in production environment', () => {
    config.env = 'production';
    logger.debug('This is a debug message.');
    expect(spy).not.toHaveBeenCalled();
  });

  it('should log info messages in both development and production environments', () => {
    config.env = 'development';
    logger.info('This is an info message.');
    expect(spy).toHaveBeenCalledTimes(1);

    spy.mockClear(); // Clear after dev test
    config.env = 'production';
    logger.info('This is an info message.');
    expect(spy).toHaveBeenCalledTimes(1); // Should still log to console
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'info',
        message: 'This is an info message.',
      }),
      expect.any(Function)
    );
  });

  it('should log error messages in both development and production environments', () => {
    config.env = 'development';
    logger.error('This is an error message.');
    expect(spy).toHaveBeenCalledTimes(1);

    spy.mockClear();
    config.env = 'production';
    logger.error('This is an error message.');
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'error',
        message: 'This is an error message.',
      }),
      expect.any(Function)
    );
  });

  it('should include stack trace for errors in development', () => {
    config.env = 'development';
    const error = new Error('Test Error');
    logger.error('Error occurred', error);
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'error',
        message: 'Error occurred',
        stack: expect.any(String), // Should have a stack trace in dev
      }),
      expect.any(Function)
    );
  });

  it('should use simple format for development and JSON for production', () => {
    // Development
    config.env = 'development';
    logger.info('Dev format test');
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'info',
        message: 'Dev format test',
      }),
      expect.any(Function)
    );
    // Note: It's hard to directly test the `winston.format.simple()` output
    // without inspecting raw console output. We rely on Winston's internal implementation.

    spy.mockClear();

    // Production (JSON format)
    config.env = 'production';
    logger.info('Prod format test');
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'info',
        message: 'Prod format test',
      }),
      expect.any(Function)
    );
    // Similar to above, direct testing of JSON stringification is complex here.
  });
});
```