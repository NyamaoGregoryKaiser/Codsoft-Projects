# Stage 1: Build the TypeScript application
FROM node:18-alpine AS build

WORKDIR /app

COPY package.json yarn.lock* package-lock.json* ./
RUN npm install --frozen-lockfile

COPY . .

RUN npm run build

# Stage 2: Run the application
FROM node:18-alpine

WORKDIR /app

# Copy production dependencies only
COPY --from=build /app/package.json ./
RUN npm install --omit=dev --frozen-lockfile

# Copy built application files
COPY --from=build /app/dist ./dist
COPY --from=build /app/.env.example ./.env.example
# Copy .env file if it exists, otherwise rely on env vars
COPY --from=build /app/.env ./.env || true

EXPOSE 5000

# Set entrypoint to run migrations and then start the server
# In production, migrations should be handled as a separate deployment step
# and not run on every container start. This is simplified for demonstration.
CMD ["sh", "-c", "npm run migrate && npm run seed && npm start"]
# Note: npm run seed includes schema drop and migrations, so the first migrate might be redundant,
# but ensures migrations run even if seed is skipped. For a true production setup,
# database migrations would be run by your CI/CD or a dedicated orchestrator before the app starts.