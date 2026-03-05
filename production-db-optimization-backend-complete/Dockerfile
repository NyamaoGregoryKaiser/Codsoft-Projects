# --- Build Frontend ---
FROM node:18-alpine as frontend-builder
WORKDIR /app/client
COPY src/client/package.json src/client/yarn.lock ./
RUN yarn install
COPY src/client/ ./
RUN yarn build

# --- Build Backend ---
FROM node:18-alpine as backend-builder
WORKDIR /app/server
COPY src/server/package.json src/server/yarn.lock ./
RUN yarn install --production
COPY src/server/ ./

# --- Production Image ---
FROM node:18-alpine
WORKDIR /app

# Copy backend
COPY --from=backend-builder /app/server /app/server
# Copy frontend static files
COPY --from=frontend-builder /app/client/build /app/client/build

# Expose port (ensure it matches your server's PORT env var)
EXPOSE 5000

# Create a non-root user for security
RUN addgroup -g 1001 appgroup && adduser -u 1001 -G appgroup -s /bin/sh -D appuser
USER appuser

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000
# Ensure your production .env vars are handled securely (e.g., Kubernetes secrets, Docker secrets)
# For local Docker Compose, .env file mapping is used.

# Command to run the application
CMD ["node", "server/server.js"]