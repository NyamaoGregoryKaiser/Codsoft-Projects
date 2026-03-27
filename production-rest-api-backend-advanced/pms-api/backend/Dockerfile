# Use a Node.js base image
FROM node:20-alpine AS builder

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application source code
COPY . .

# Build the TypeScript application
RUN npm run build

# --- Production Stage ---
FROM node:20-alpine

WORKDIR /app

# Copy production dependencies from builder stage
COPY --from=builder /app/package*.json ./
RUN npm install --omit=dev

# Copy built application code from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/.env.example ./.env.example
COPY --from=builder /app/logs ./logs
COPY --from=builder /app/src/db/migrations ./src/db/migrations
COPY --from=builder /app/src/db/seeds ./src/db/seeds
COPY --from=builder /app/src/docs ./src/docs

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD ["node", "dist/server.js"]
```

#### `pms-api/frontend/Dockerfile`
```dockerfile