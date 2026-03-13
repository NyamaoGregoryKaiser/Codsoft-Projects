```dockerfile
# Stage 1: Build the TypeScript application
FROM node:18-alpine as builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY tsconfig.json .
COPY ormconfig.ts .
COPY src ./src
COPY migrations ./migrations # For local dev with docker volumes, migrations could be here. For build, ensure they are copied.
COPY seeds ./seeds

RUN npm run build

# Stage 2: Run the application
FROM node:18-alpine

WORKDIR /app

# Install production dependencies only
COPY package.json package-lock.json ./
RUN npm install --production

# Copy built application files from the builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/ormconfig.ts ./ormconfig.ts
COPY --from=builder /app/src/migrations ./src/migrations
COPY --from=builder /app/src/seeds ./src/seeds

# Copy .env.example or create .env at runtime in production
# For local development with Docker Compose, you would mount the .env file.
# For production, consider using environment variables injected by your orchestration system.
COPY .env.example .env

EXPOSE 5000

# Command to run migrations and then start the application
# For production, migrations should be run as a separate step/job.
# For this comprehensive example, we run them on container start.
CMD ["sh", "-c", "npm run migrate:run && npm run seed:run && npm start"]
```