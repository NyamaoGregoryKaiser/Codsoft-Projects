```dockerfile
# Stage 1: Build dependencies
FROM node:18-alpine AS builder

WORKDIR /app

COPY backend/package.json backend/package-lock.json ./
RUN npm install --production --frozen-lockfile

# Stage 2: Production image
FROM node:18-alpine

WORKDIR /app

# Copy production dependencies from builder stage
COPY --from=builder /app/node_modules ./node_modules
# Copy application source code
COPY backend/src ./src
COPY backend/package.json .
COPY backend/.sequelizerc . # Needed for sequelize-cli commands
COPY backend/config ./config
COPY backend/migrations ./migrations
COPY backend/seeders ./seeders
COPY backend/tests ./tests

ENV NODE_ENV=production
EXPOSE 5000

# For production, you'd typically run migrations/seeds via CI/CD or separate script
# For development via docker-compose, we run it in the command directly
CMD ["node", "src/server.js"]
```