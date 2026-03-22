```dockerfile
# Stage 1: Build the application
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy the rest of the application code
COPY . .

# Generate Prisma Client (needed for runtime)
ENV DATABASE_URL="postgresql://user:password@db:5432/taskdb?schema=public" # Placeholder for build-time client generation
RUN npx prisma generate

# Stage 2: Create the production-ready image
FROM node:18-alpine

WORKDIR /app

# Copy only necessary files from the builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/src ./src
COPY --from=builder /app/server.js ./server.js
COPY --from=builder /app/prisma ./prisma

# Expose the port the app runs on
EXPOSE 5000

# Run database migrations and seed data on startup (for simple deployments, not ideal for large scale)
# A better approach for production is to run migrations as part of CI/CD or separate migration job.
# CMD sh -c "npx prisma migrate deploy && npx prisma db seed && npm start"
# For this example, we'll run migrations manually after `docker-compose up` to avoid race conditions with DB startup.
CMD ["npm", "start"]
```