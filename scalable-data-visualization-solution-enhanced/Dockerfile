```dockerfile
# Stage 1: Build the backend application
FROM node:18-alpine AS development

WORKDIR /app/server

# Copy package.json and install dependencies
COPY server/package*.json ./
RUN npm install

# Copy the rest of the source code
COPY server .

# Build TypeScript for development (optional, as ts-node-dev handles it)
# RUN npm run build

# Expose port for the backend server
EXPOSE 5000

# Default command for development (overridden by docker-compose)
CMD ["npm", "run", "dev"]

# Stage 2: Build the frontend application
# This stage is for client container, handled by Dockerfile.client

# Stage 3: Production build for the backend (optional, for smaller images)
FROM node:18-alpine AS production

WORKDIR /app/server

# Copy package.json and install production dependencies only
COPY server/package*.json ./
RUN npm install --only=production

# Copy built artifacts from the development stage
COPY --from=development /app/server/dist ./dist
COPY server/.env ./
COPY server/ormconfig.json ./
# If migrations are run at startup, copy them too
COPY server/src/migrations ./src/migrations

# Expose port for the backend server
EXPOSE 5000

# Production command
CMD ["npm", "start"]
```