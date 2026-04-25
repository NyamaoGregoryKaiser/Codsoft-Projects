```dockerfile
# Root Dockerfile
# Multi-stage build for frontend and backend

# --- Frontend Build ---
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package.json frontend/yarn.lock ./
RUN yarn install --frozen-lockfile
COPY frontend/ .
ARG REACT_APP_API_BASE_URL
ENV REACT_APP_API_BASE_URL=$REACT_APP_API_BASE_URL
RUN yarn build

# --- Backend Build ---
FROM node:18-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package.json backend/yarn.lock ./
RUN yarn install --frozen-lockfile
COPY backend/ .
RUN npx sequelize-cli db:migrate # Run migrations during build time for consistency (or via entrypoint)
# Alternative: Run migrations at container startup via an entrypoint script
# COPY entrypoint.sh /usr/local/bin/entrypoint.sh
# RUN chmod +x /usr/local/bin/entrypoint.sh
# ENTRYPOINT ["entrypoint.sh"]

# --- Production Backend ---
FROM node:18-alpine AS production
WORKDIR /app
# Install Puppeteer dependencies
RUN apk add --no-cache udev chromium nss freetype freetype-dev harfbuzz ca-certificates \
    ttf-freefont fontconfig openjdk17-jre \
    # Cleanup
    && rm -rf /var/cache/apk/* /tmp/*

# Copy built frontend
COPY --from=frontend-builder /app/frontend/build /app/frontend/build

# Copy backend
COPY --from=backend-builder /app/backend /app/backend

# Environment variables for Puppeteer
ENV PUPPETEER_CACHE_DIR=/app/backend/.cache/puppeteer
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PUPPETEER_PRODUCT=chrome

WORKDIR /app/backend
# Expose port for the backend
EXPOSE 5000

CMD ["node", "src/server.js"]
```