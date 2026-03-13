```dockerfile
# Stage 1: Build the TypeScript application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package.json and package-lock.json first to leverage Docker cache
COPY package.json yarn.lock* package-lock.json* ./

# Install dependencies
RUN npm install --frozen-lockfile

# Copy the rest of the application source code
COPY . .

# Build the TypeScript code
RUN npm run build

# Stage 2: Run the application
FROM node:20-alpine AS runner

WORKDIR /app

# Copy package.json only for production dependencies
COPY package.json ./

# Install only production dependencies
# Using `npm ci` is more reliable for CI/CD in production
RUN npm ci --only=production && npm cache clean --force

# Copy the compiled application from the builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/.env.example ./.env.example
# Copy package.json again to ensure it's present for `npm ci`
COPY --from=builder /app/package.json ./package.json

# Expose the port the app runs on
ENV PORT=5000
EXPOSE ${PORT}

# Command to run database migrations and then start the server
# This will run migrations on container start, useful for fresh deployments or CI/CD.
# For production, consider running migrations as a separate step or a dedicated job.
CMD sh -c "npm run typeorm -- -d dist/database/data-source.js migration:run && npm start"
```