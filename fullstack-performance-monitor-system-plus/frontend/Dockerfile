# Stage 1: Build the React application
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build # Build the React app

# Stage 2: Serve the application with Nginx (for production)
# For development, Vite's dev server is typically used, or just serving build/dist
FROM nginx:alpine

WORKDIR /usr/share/nginx/html

# Remove default Nginx configuration
RUN rm -rf ./*

# Copy the built React app from the builder stage
COPY --from=builder /app/dist .

# Copy custom Nginx configuration (optional, for SPA routing)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]