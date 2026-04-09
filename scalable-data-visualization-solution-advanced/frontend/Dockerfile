```dockerfile
# Stage 1: Build the React application
FROM node:18-alpine AS builder

WORKDIR /app/frontend

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .

# Build the React app for production
RUN yarn build

# Stage 2: Serve the application with Nginx (or just serve static files with a simple HTTP server)
FROM nginx:alpine

# Copy the built React app from the builder stage
COPY --from=builder /app/frontend/build /usr/share/nginx/html

# Optional: Copy a custom nginx configuration
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
```