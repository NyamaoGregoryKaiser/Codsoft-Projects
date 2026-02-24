{
  "name": "appmonitor-backend",
  "version": "1.0.0",
  "description": "Backend for AppMonitor performance monitoring system",
  "main": "server.js",
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "test": "cross-env NODE_ENV=test jest --detectOpenHandles --forceExit --coverage",
    "test:watch": "cross-env NODE_ENV=test jest --watch",
    "migrate:make": "knex migrate:make --knexfile src/db/knexfile.js",
    "migrate:latest": "knex migrate:latest --knexfile src/db/knexfile.js",
    "migrate:rollback": "knex migrate:rollback --knexfile src/db/knexfile.js",
    "seed:make": "knex seed:make --knexfile src/db/knexfile.js",
    "seed:run": "knex seed:run --knexfile src/db/knexfile.js",
    "lint": "eslint src/",
    "lint:fix": "eslint src/ --fix"
  },
  "keywords": [],
  "author": "Your Name",
  "license": "MIT",
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "express-rate-limit": "^7.1.5",
    "helmet": "^7.1.0",
    "jsonwebtoken": "^9.0.2",
    "knex": "^3.1.0",
    "moment": "^2.30.1",
    "morgan": "^1.10.0",
    "pg": "^8.11.3",
    "redis": "^4.6.12",
    "winston": "^3.11.0"
  },
  "devDependencies": {
    "@eslint/js": "^8.56.0",
    "cross-env": "^7.0.3",
    "eslint": "^8.56.0",
    "globals": "^13.24.0",
    "jest": "^29.7.0",
    "nodemon": "^3.0.2",
    "supertest": "^6.3.4"
  },
  "jest": {
    "testEnvironment": "node",
    "coveragePathIgnorePatterns": [
      "/node_modules/",
      "/src/db/migrations/",
      "/src/db/seeds/"
    ]
  }
}