# Use a Node.js LTS image as the base
FROM node:20-alpine AS build

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock) to leverage Docker cache
COPY package*.json ./

# Install dependencies
# Using --force-orphan to prune any existing node_modules from previous layers
# npm ci is preferred for CI/CD environments as it uses package-lock.json
RUN npm ci --force-orphan

# Copy the rest of the application source code
COPY . .

# Build the NestJS application
RUN npm run build

# --- Production Image ---
FROM node:20-alpine AS production

# Set the working directory
WORKDIR /app

# Install only production dependencies
COPY package*.json ./
RUN npm ci --only=production --force-orphan

# Copy the built application from the 'build' stage
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
# If you have specific files like views, public assets, etc., copy them:
# COPY --from=build /app/public ./public

# Expose the port the NestJS application runs on
EXPOSE 3000

# Set environment variables (if needed, but usually from docker-compose or Kubernetes)
# ENV NODE_ENV=production

# Command to run the application
CMD ["node", "dist/main"]