export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

export enum ScrapeJobStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed', // For one-off jobs
  FAILED = 'failed',
}

export enum LogLevel {
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  DEBUG = 'debug',
}