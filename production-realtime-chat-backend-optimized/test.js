{
  "name": "chat-app-backend",
  "version": "1.0.0",
  "description": "Real-time chat application backend",
  "main": "server.js",
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "migrate": "npx sequelize-cli db:migrate",
    "migrate:undo": "npx sequelize-cli db:migrate:undo",
    "seed": "npx sequelize-cli db:seed:all",
    "seed:undo": "npx sequelize-cli db:seed:undo:all",
    "test": "jest --detectOpenHandles --forceExit",
    "test:coverage": "jest --detectOpenHandles --forceExit --coverage"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "@socket.io/redis-adapter": "^8.2.1",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "express-rate-limit": "^7.2.0",
    "helmet": "^7.1.0",
    "hpp": "^0.2.3",
    "http-status": "^1.7.4",
    "joi": "^17.12.3",
    "jsonwebtoken": "^9.0.2",
    "lodash": "^4.17.21",
    "pg": "^8.11.5",
    "pg-hstore": "^2.3.4",
    "redis": "^4.6.14",
    "sequelize": "^6.37.2",
    "socket.io": "^4.7.5",
    "winston": "^3.13.0",
    "xss-clean": "^0.1.4"
  },
  "devDependencies": {
    "jest": "^29.7.0",
    "nodemon": "^3.1.0",
    "sequelize-cli": "^6.6.2",
    "supertest": "^6.3.4"
  }
}