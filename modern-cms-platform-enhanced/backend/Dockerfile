```dockerfile
# Stage 1: Build dependencies for faster builds (optional but good practice)
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Stage 2: Production image
FROM node:18-alpine

WORKDIR /app

# Copy dependencies from the builder stage
COPY --from=builder /app/node_modules ./node_modules

# Copy the rest of the application code
COPY . .

# Create uploads directory if it doesn't exist
RUN mkdir -p /app/uploads

# Expose the port the app runs on
EXPOSE 5000

# Run database migrations and seed data
# This is for initial setup. In production, migrations should be run carefully.
# For demo purposes, we run them here.
# ENV DATABASE_URL="postgres://user:password@host:port/database" # Use this if not using DB_ env vars
# RUN npm run migrate && npm run seed

# Command to run the application
CMD ["npm", "start"]
```