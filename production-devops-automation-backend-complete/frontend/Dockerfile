```dockerfile
# Stage 1: Build the React application
FROM node:18-alpine AS builder

WORKDIR /app

COPY package.json ./
COPY package-lock.json ./

RUN npm install

COPY . ./

# Build the React app
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:alpine AS production

# Copy the built React app from the builder stage
COPY --from=builder /app/build /usr/share/nginx/html

# Copy custom Nginx configuration (e.g., for routing, security headers)
# Create a default.conf if needed for SPA routing (e.g., try_files $uri $uri/ /index.html;)
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```