```dockerfile
# Stage 1: Build React app
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci # Install all dependencies for build
COPY . .
RUN npm run build

# Stage 2: Serve React app with Nginx
FROM nginx:alpine

COPY --from=builder /app/build /usr/share/nginx/html

# Copy custom Nginx configuration (optional, for advanced setup)
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```