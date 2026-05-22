```dockerfile
# Stage 1: Build the TypeScript application
FROM node:18-alpine AS builder

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY tsconfig.json ormconfig.json ./
COPY src ./src

RUN yarn build

# Stage 2: Run the application
FROM node:18-alpine

WORKDIR /app

# Install production dependencies only
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production

# Copy built application and static assets
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/uploads ./uploads # If you want to include initial uploads or ensure directory exists
COPY --from=builder /app/ormconfig.json ./ormconfig.json # For TypeORM migrations/seeding

# Create logs directory
RUN mkdir -p logs

EXPOSE 5000

CMD ["node", "dist/server.js"]
```