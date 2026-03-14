```dockerfile
# Stage 1: Build the React application
FROM node:18-alpine as builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Build the React app for production
# Ensure REACT_APP_API_BASE_URL and REACT_APP_SOCKET_URL are passed during build if dynamic
ARG REACT_APP_API_BASE_URL
ARG REACT_APP_SOCKET_URL
ENV REACT_APP_API_BASE_URL=${REACT_APP_API_BASE_URL:-http://localhost:5000/api}
ENV REACT_APP_SOCKET_URL=${REACT_APP_SOCKET_URL:-http://localhost:5000}

RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:alpine

# Copy the built React app from the builder stage
COPY --from=builder /app/build /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 for the Nginx server
EXPOSE 80

# Command to start Nginx
CMD ["nginx", "-g", "daemon off;"]
```