const dotenv = require('dotenv');
const Joi = require('joi');

dotenv.config();

const envVarsSchema = Joi.object()
  .keys({
    NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
    PORT: Joi.number().default(5000),
    DATABASE_URL: Joi.string().required().description('PostgreSQL database URL'),
    JWT_SECRET: Joi.string().required().description('JWT secret key'),
    JWT_ACCESS_EXPIRATION_MINUTES: Joi.number().default(30).description('minutes after which access tokens expire'),
    JWT_REFRESH_EXPIRATION_DAYS: Joi.number().default(30).description('days after which refresh tokens expire'),
    BCRYPT_SALT_ROUNDS: Joi.number().default(10).description('Number of salt rounds for bcrypt'),
    REDIS_URL: Joi.string().required().description('Redis connection URL'),
    CORS_ORIGIN: Joi.string().required().description('CORS origin URL for frontend'),
    ADMIN_EMAIL: Joi.string().email().required().description('Default admin email'),
    ADMIN_PASSWORD: Joi.string().required().description('Default admin password'),
    RUN_SEEDS: Joi.boolean().default(false).description('Whether to run database seeds on startup (dev only)'),
  })
  .unknown(); // Allow unknown variables

const { value: envVars, error } = envVarsSchema.prefs({ errors: { label: 'key' } }).validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

module.exports = {
  NODE_ENV: envVars.NODE_ENV,
  PORT: envVars.PORT,
  DATABASE_URL: envVars.DATABASE_URL,
  JWT_SECRET: envVars.JWT_SECRET,
  JWT_ACCESS_EXPIRATION_MINUTES: envVars.JWT_ACCESS_EXPIRATION_MINUTES,
  JWT_REFRESH_EXPIRATION_DAYS: envVars.JWT_REFRESH_EXPIRATION_DAYS,
  BCRYPT_SALT_ROUNDS: envVars.BCRYPT_SALT_ROUNDS,
  REDIS_URL: envVars.REDIS_URL,
  CORS_ORIGIN: envVars.CORS_ORIGIN,
  ADMIN_EMAIL: envVars.ADMIN_EMAIL,
  ADMIN_PASSWORD: envVars.ADMIN_PASSWORD,
  RUN_SEEDS: envVars.RUN_SEEDS,
};