```javascript
const dotenv = require('dotenv');
const path = require('path');
const Joi = require('joi');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const envVarsSchema = Joi.object()
  .keys({
    NODE_ENV: Joi.string().valid('production', 'development', 'test').required(),
    PORT: Joi.number().default(5000),
    DB_DIALECT: Joi.string().valid('postgres').default('postgres'),
    DB_HOST: Joi.string().required().description('Database host'),
    DB_PORT: Joi.number().default(5432),
    DB_USER: Joi.string().required().description('Database user'),
    DB_PASSWORD: Joi.string().required().description('Database password'),
    DB_NAME: Joi.string().required().description('Database name'),
    JWT_SECRET: Joi.string().required().description('JWT secret key'),
    JWT_ACCESS_EXPIRATION_MINUTES: Joi.number().default(30).description('minutes after which access tokens expire'),
    JWT_REFRESH_EXPIRATION_DAYS: Joi.number().default(7).description('days after which refresh tokens expire'),
    LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly').default('info'),
    ADMIN_USERNAME: Joi.string().required().description('Default admin username'),
    ADMIN_EMAIL: Joi.string().email().required().description('Default admin email'),
    ADMIN_PASSWORD: Joi.string().required().description('Default admin password'),
    CACHE_TTL_SECONDS: Joi.number().default(300).description('Cache time-to-live in seconds'),
  })
  .unknown();

const { value: envVars, error } = envVarsSchema.prefs({ errors: { label: 'key' } }).validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

module.exports = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  jwt: {
    secret: envVars.JWT_SECRET,
    accessExpirationMinutes: envVars.JWT_ACCESS_EXPIRATION_MINUTES,
    refreshExpirationDays: envVars.JWT_REFRESH_EXPIRATION_DAYS,
  },
  db: {
    dialect: envVars.DB_DIALECT,
    host: envVars.DB_HOST,
    port: envVars.DB_PORT,
    username: envVars.DB_USER,
    password: envVars.DB_PASSWORD,
    database: envVars.DB_NAME,
  },
  log: {
    level: envVars.LOG_LEVEL,
  },
  admin: {
    username: envVars.ADMIN_USERNAME,
    email: envVars.ADMIN_EMAIL,
    password: envVars.ADMIN_PASSWORD,
  },
  cache: {
    ttlSeconds: envVars.CACHE_TTL_SECONDS,
  },
};
```