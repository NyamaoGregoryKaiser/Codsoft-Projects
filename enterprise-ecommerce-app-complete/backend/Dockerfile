```dockerfile
# Stage 1: Build the TypeScript application
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json yarn.lock* ./
RUN yarn install --frozen-lockfile --production=false # Install dev dependencies for build

COPY . .

# Generate Prisma client and build TypeScript
RUN yarn prisma:generate
RUN yarn build

# Stage 2: Create the production-ready image
FROM node:20-alpine

WORKDIR /app

# Install only production dependencies
COPY --from=builder /app/package.json /app/yarn.lock* ./
RUN yarn install --frozen-lockfile --production

# Copy built application and Prisma files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/.env.example ./.env.example # Copy example env for reference

# Expose the port the app runs on
EXPOSE 5000

# Set environment variables for Prisma at runtime (ensure these are set in docker-compose or deployment)
ENV NODE_ENV=production
ENV DATABASE_URL=${DATABASE_URL}
ENV JWT_SECRET=${JWT_SECRET}
ENV REDIS_URL=${REDIS_URL}

# Command to run the application
CMD ["node", "dist/server.js"]
```