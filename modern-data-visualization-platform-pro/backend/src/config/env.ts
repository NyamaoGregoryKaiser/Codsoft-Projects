import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Backend Server Configuration
export const NODE_ENV: string = process.env.NODE_ENV || 'development';
export const PORT: string = process.env.PORT || '5000';
export const API_PREFIX: string = process.env.API_PREFIX || '/api/v1';

// Database Configuration
export const DB_HOST: string = process.env.DB_HOST || 'localhost';
export const DB_PORT: string = process.env.DB_PORT || '5432';
export const DB_USER: string = process.env.DB_USER || 'postgres';
export const DB_PASSWORD: string = process.env.DB_PASSWORD || 'postgres'; // Use a strong password in production
export const DB_NAME: string = process.env.DB_NAME || 'data_viz_db';

// JWT Configuration
export const JWT_SECRET: string = process.env.JWT_SECRET || 'changeme_to_a_strong_secret_in_production';
export const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '1h';

// Redis Configuration
export const REDIS_HOST: string = process.env.REDIS_HOST || 'localhost';
export const REDIS_PORT: number = parseInt(process.env.REDIS_PORT || '6379', 10);

// Ensure essential variables are set in production
if (NODE_ENV === 'production' && (!DB_PASSWORD || !JWT_SECRET)) {
  console.error('CRITICAL ERROR: Essential environment variables (DB_PASSWORD, JWT_SECRET) are not set for production!');
  process.exit(1);
}