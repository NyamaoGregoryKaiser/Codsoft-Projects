# Use a lightweight Node.js base image
FROM node:20-alpine AS build

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json first to leverage Docker cache
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 5000

# Set environment variables for production
ENV NODE_ENV=production
# Do not automatically run migrations in production without explicit flag
# ENV APPLY_MIGRATIONS=false

# Command to run the application
CMD ["node", "src/server.js"]

# --- Development Stage (Optional, for faster local dev container builds) ---
FROM node:20-alpine AS development

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5000

CMD ["npm", "run", "dev"]
```