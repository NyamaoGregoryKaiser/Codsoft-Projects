```dockerfile
# Stage 1: Build the React application
FROM node:18-alpine AS builder

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY .env.example .env.production ./ # Copy env files for build, adjust as needed
COPY tsconfig.json vite.config.ts ./
COPY public ./public
COPY src ./src

# Build the app for production
RUN yarn build

# Stage 2: Serve the application with Nginx (for production)
# For simplicity, during development or demo, you can directly serve from Node,
# but for production, a dedicated web server like Nginx is recommended.
# This example uses a simple Node.js server for demonstration within Docker.
FROM node:18-alpine

WORKDIR /app

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Install a simple static server
RUN yarn add serve

EXPOSE 3000

# Use serve to host the static files
CMD ["serve", "-s", "dist", "-l", "3000"]

# Alternative using Nginx for production:
# FROM nginx:stable-alpine
# COPY --from=builder /app/dist /usr/share/nginx/html
# # Custom Nginx config if needed
# # COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf
# EXPOSE 80
# CMD ["nginx", "-g", "daemon off;"]
```