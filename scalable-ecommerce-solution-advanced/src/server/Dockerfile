# Use a Node.js 20 Alpine image for a smaller footprint
FROM node:20-alpine AS build

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json first to leverage Docker cache
COPY package.json ./
COPY tsconfig.json ./
COPY ./src ./src

# Install dependencies
RUN npm install

# Build the TypeScript project
RUN npm run build

# --- Production Stage ---
FROM node:20-alpine

WORKDIR /app

# Copy production dependencies only
COPY --from=build /app/package.json ./package.json
RUN npm install --only=production

# Copy built application and required assets
COPY --from=build /app/dist ./dist
COPY --from=build /app/src/database/migrations ./src/database/migrations
COPY --from=build /app/src/database/seed ./src/database/seed
# Ensure logs directory exists if logs are written inside container
RUN mkdir -p /app/logs

# Expose the port the app runs on
EXPOSE 5000

# Set environment variables for production if not using .env
# ENV NODE_ENV=production
# ENV PORT=5000
# ... other prod env vars ...

# Run migrations and seed data on startup (careful in prod, usually manual)
# CMD ["sh", "-c", "npm run migrate:run && npm run seed:run && npm start"]
# Better: run migrations/seed manually or via a separate CI/CD step.
# For simplicity in this demo, we'll just start.
CMD ["npm", "start"]