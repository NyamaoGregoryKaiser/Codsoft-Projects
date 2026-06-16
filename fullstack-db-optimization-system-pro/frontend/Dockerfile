```dockerfile
# Stage 1: Build the React application
FROM node:18-alpine AS builder

WORKDIR /app

COPY frontend/package.json frontend/package-lock.json ./
RUN npm install --frozen-lockfile

COPY frontend/ .
RUN npm run build

# Stage 2: Serve the application with Nginx (optional, can also serve with static files server like `serve`)
# For simplicity and aligning with react-scripts start, we'll use a Node server here.
FROM node:18-alpine

WORKDIR /app

# Install 'serve' package globally to serve static files
RUN npm install -g serve

# Copy built assets from the builder stage
COPY --from=builder /app/build ./build

ENV PORT=3000
EXPOSE 3000

# Command to serve the static built application
CMD ["serve", "-s", "build", "-l", "3000"]

# If you want to run `npm start` (development server) directly in Docker:
# FROM node:18-alpine
# WORKDIR /app
# COPY frontend/package.json frontend/package-lock.json ./
# RUN npm install
# COPY frontend/ .
# EXPOSE 3000
# CMD ["npm", "start"]
```