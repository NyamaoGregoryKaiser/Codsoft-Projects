```dockerfile
# Stage 1: Build the application
FROM node:18-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install --omit=dev

COPY . .

# Stage 2: Production image
FROM node:18-alpine AS production

WORKDIR /app

# Install production dependencies only (from builder stage to ensure consistency)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/server.js ./server.js
COPY --from=builder /app/src ./src
COPY --from=builder /app/migrations ./migrations
COPY --from=builder /app/seeders ./seeders
COPY --from=builder /app/.env.example ./.env.example # For reference, not directly used

# Expose the port the app runs on
EXPOSE 5000

# Run database migrations and seeds
# NOTE: In a real-world scenario, migrations are often run as a separate step
# during deployment or in a dedicated "migration" container.
# For simplicity in this full-stack example, we run them on startup.
# Ensure your entrypoint script handles this idempotently.
# CMD ["sh", "-c", "npx sequelize db:migrate && npx sequelize db:seed:all && node server.js"]
# Better approach: Separate script or dedicated migration job.
# For this example, let's keep it simple for illustration of a single container build.
# We'll rely on docker-compose init or CI/CD to handle migrations/seeding.
CMD ["node", "server.js"]
```