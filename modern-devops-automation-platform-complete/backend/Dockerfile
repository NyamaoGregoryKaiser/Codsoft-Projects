```dockerfile
# Stage 1: Build the TypeScript application
FROM node:18-alpine AS builder

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production=false

COPY . .

# Build the TypeScript code
RUN yarn build

# Stage 2: Create the production-ready image
FROM node:18-alpine AS production

WORKDIR /app

# Copy production dependencies only
COPY --from=builder /app/package.json /app/yarn.lock ./
RUN yarn install --frozen-lockfile --production=true

# Copy compiled JavaScript code and other necessary files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/migrations ./src/migrations # Migrations are needed at runtime
COPY --from=builder /app/.env.example ./

# Expose the port the app runs on
EXPOSE 5000

# Set environment variables for production
ENV NODE_ENV=production
# Default port, can be overridden by runtime env vars
ENV PORT=5000

# Command to run the application
CMD ["node", "dist/server.js"]
```