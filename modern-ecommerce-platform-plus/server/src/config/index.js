```javascript
// server/src/config/index.js
require('dotenv').config();

module.exports = {
  port: process.env.PORT || 5000,
  env: process.env.NODE_ENV || 'development',
  jwt: {
    secret: process.env.JWT_SECRET || 'supersecretjwtkey',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  },
  databaseUrl: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/ecommerce_db?schema=public',
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },
  // Other configurations like email service, payment keys, etc.
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || 'sk_test_YOUR_STRIPE_SECRET_KEY',
  adminEmail: process.env.ADMIN_EMAIL || 'admin@example.com',
};

```