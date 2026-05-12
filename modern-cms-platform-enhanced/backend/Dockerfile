```dockerfile
# Stage 1: Build dependencies
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev # Install production dependencies only

# Stage 2: Production image
FROM node:20-alpine

WORKDIR /app

# Copy production dependencies from builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY .env.example ./
COPY . .

# Expose port (ensure it matches your config.port)
EXPOSE 5000

# Run migrations and seeds, then start the application
CMD ["sh", "-c", "npm run db:migrate && npm run db:seed && npm start"]
```