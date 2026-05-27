```dockerfile
# Stage 1: Build the React frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app/client

COPY client/package.json client/package-lock.json ./
RUN npm install

COPY client/ .
RUN npm run build

# Stage 2: Build the Node.js backend
FROM node:18-alpine AS backend-builder

WORKDIR /app/server

COPY server/package.json server/package-lock.json ./
RUN npm install --omit=dev

COPY server/ .

# Ensure upload directories exist
RUN mkdir -p uploads/posts uploads/media uploads/misc

# Stage 3: Final production image
FROM node:18-alpine

WORKDIR /app

# Copy built frontend from stage 1
COPY --from=frontend-builder /app/client/build ./client/build

# Copy backend from stage 2
COPY --from=backend-builder /app/server ./server

# Copy .env configuration (or mount it as a volume in production)
# For production, it's better to pass environment variables directly or use a secret management system.
# For simplicity in this example, we copy it. In a real scenario, DO NOT commit .env to Git.
# COPY .env ./server/.env 

# Expose the port the app runs on
EXPOSE 5000

# Set environment variables (for production, these might come from orchestration)
ENV NODE_ENV=production
ENV PORT=5000

# Define the command to run the backend application
CMD ["node", "server/src/server.js"]
```