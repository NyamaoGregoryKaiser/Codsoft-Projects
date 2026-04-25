# Use a Node.js 18 (LTS) or later base image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (if any) to install dependencies
COPY backend/package*.json ./

# Install dependencies. Use npm ci for clean installs in CI/CD.
RUN npm ci

# Copy the rest of the backend source code
COPY backend/src ./src
COPY backend/ormconfig.ts ./
COPY backend/tsconfig.json ./

# Build the TypeScript code
RUN npm run build

# Expose the port the app runs on
EXPOSE 5000

# Command to run the application (in production mode)
# In development, you might use a different command via docker-compose override
CMD ["node", "dist/server.js"]