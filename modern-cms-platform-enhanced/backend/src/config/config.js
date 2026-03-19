```javascript
module.exports = {
    env: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 5000,
    jwtSecret: process.env.JWT_SECRET || 'supersecretjwtkeyforlocaldev',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
    database: {
        username: process.env.DB_USER || 'cmsuser',
        password: process.env.DB_PASSWORD || 'cmspassword',
        database: process.env.DB_NAME || 'cms_db',
        host: process.env.DB_HOST || 'localhost',
        dialect: process.env.DB_DIALECT || 'postgres',
        port: process.env.DB_PORT || 5432,
    },
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD, // Optional
    },
    clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
    logLevel: process.env.LOG_LEVEL || 'info',
    uploadDir: process.env.UPLOAD_DIR || 'uploads',
};
```