```dockerfile
# Stage 1: Build the React application
FROM node:18-alpine as builder

WORKDIR /app

# Copy package.json and install dependencies
COPY frontend/package.json ./
COPY frontend/package-lock.json ./
RUN npm install --silent

# Copy the rest of the frontend code
COPY frontend/public ./public
COPY frontend/src ./src
COPY frontend/tailwind.config.js ./
COPY frontend/postcss.config.js ./

# Build the React app
RUN npm run build

# Stage 2: Serve the built application with Nginx (or similar) for production
# For simplicity and direct Docker Compose integration with React dev server,
# we'll use a single stage for now that mimics dev server behavior.
# For production deployment, a second stage with Nginx would be preferred.

FROM node:18-alpine

WORKDIR /app

# Copy built files from the builder stage if using multi-stage build for production
# COPY --from=builder /app/build ./build

# For development, copy over everything and run dev server
COPY frontend/package.json ./
COPY frontend/package-lock.json ./
RUN npm install --silent # Install dependencies needed for dev server

COPY frontend/public ./public
COPY frontend/src ./src
COPY frontend/tailwind.config.js ./
COPY frontend/postcss.config.js ./

# Expose the port the React app runs on
EXPOSE 3000

# Command to run the React development server
CMD ["npm", "start"]
```