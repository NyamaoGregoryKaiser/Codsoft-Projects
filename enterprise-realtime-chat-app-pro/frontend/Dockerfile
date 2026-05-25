```dockerfile
# Stage 1: Build the React application
FROM node:18-alpine AS builder

WORKDIR /app/frontend

COPY package.json .
COPY package-lock.json .
RUN npm ci --prefer-offline

COPY . .

RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:alpine

WORKDIR /usr/share/nginx/html

# Remove default Nginx welcome page
RUN rm -rf ./*

# Copy built React app from the builder stage
COPY --from=builder /app/frontend/dist .

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```