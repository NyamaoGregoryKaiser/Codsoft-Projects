```dockerfile
# Stage 1: Build the NestJS application
FROM node:18-alpine AS builder

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile # Use yarn if yarn.lock exists, otherwise npm ci

COPY . .

RUN yarn build

# Stage 2: Run the NestJS application
FROM node:18-alpine AS runner

WORKDIR /app

# Install dependencies needed for TypeORM with Postgres, e.g., pg driver
RUN apk add --no-cache libpq

# Copy production dependencies from builder stage to ensure only necessary packages are present
COPY --from=builder /app/package.json /app/yarn.lock ./
RUN yarn install --frozen-lockfile --production --ignore-scripts --prefer-offline

# Copy the built application from the builder stage
COPY --from=builder /app/dist ./dist

# Copy package.json to be able to run start script
COPY --from=builder /app/package.json ./package.json

# Expose the port the app runs on
EXPOSE 3000

# Set default command to start the application
CMD ["node", "dist/main"]
```