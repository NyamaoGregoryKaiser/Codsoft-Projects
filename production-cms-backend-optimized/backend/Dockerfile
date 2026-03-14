```dockerfile
# Stage 1: Build the application
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package.json and package-lock.json first to leverage Docker cache
COPY backend/package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY backend/ ./

# Build frontend if it's part of the same container (not recommended for large apps)
# For a full-scale app, frontend should be built in its own container or statically served
# Example for a simple static frontend:
# COPY frontend/ ./frontend
# RUN npm --prefix ./frontend install
# RUN npm --prefix ./frontend run build

# Stage 2: Run the application
FROM node:18-alpine

WORKDIR /app

# Copy only necessary files from the builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.env.example ./.env.example
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/server.js ./server.js
COPY --from=builder /app/src ./src
COPY --from=builder /app/logs ./logs # Create logs directory

# Expose the port the app runs on
EXPOSE 5000

# Run database migrations before starting the app (best practice for production)
# This assumes the DB service is already up and accessible.
# In a real CI/CD, migrations might be run by a separate job.
# CMD ["sh", "-c", "npm run db:migrate && npm start"]
# For simplicity, just run start and assume migrations are handled externally or by docker-compose entrypoint
CMD ["npm", "start"]
```