```dockerfile
# Stage 1: Build the TypeScript application
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

# Stage 2: Run the application
FROM node:18-alpine

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm install --only=production

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.env.example ./.env.example

# Expose the port the app runs on
EXPOSE 3000

# Set environment variables for production
ENV NODE_ENV=production

# Command to run the application
CMD ["node", "dist/server.js"]
```