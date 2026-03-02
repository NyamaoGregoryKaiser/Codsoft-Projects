# Use a Node.js base image
FROM node:20-alpine AS builder

# Set the working directory
WORKDIR /app/backend

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application source code
COPY . .

# Build the TypeScript application
RUN npm run build

# --- Production Stage ---
FROM node:20-alpine

WORKDIR /app/backend

# Copy package.json and package-lock.json again to install only production dependencies
COPY package*.json ./
RUN npm install --only=production

# Copy the built application from the builder stage
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/node_modules ./node_modules
COPY --from=builder /app/backend/logs ./logs # Ensure logs directory exists if logging to files
COPY --from=builder /app/backend/.env.example ./.env.example # Copy .env.example for reference

# Expose the port the app runs on
EXPOSE 5000

# Run database migrations before starting the app
# CMD ["sh", "-c", "npm run migrate:run && npm start"]
# For production, migrations should be handled carefully, often as a separate step in CI/CD or deploy script.
# For Docker Compose, let's keep it simple for a demo.
CMD ["node", "dist/server.js"]