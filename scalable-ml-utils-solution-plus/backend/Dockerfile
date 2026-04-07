```dockerfile
# Stage 1: Build production-ready backend
FROM node:20-alpine AS build

WORKDIR /app

# Copy package.json and package-lock.json first to leverage Docker cache
COPY package*.json ./

# Install production dependencies
RUN npm install --only=production

# Copy the rest of the application code
COPY . .

# Stage 2: Production image
FROM node:20-alpine

WORKDIR /app

# Copy production dependencies and built application from build stage
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/src ./src
COPY --from=build /app/.env.example ./.env.example # Provide example env for reference
COPY --from=build /app/package.json ./package.json

# Expose the port the app runs on
EXPOSE 5000

# Set environment variables
ENV NODE_ENV=production

# Command to run the application
CMD ["node", "src/server.js"]
```