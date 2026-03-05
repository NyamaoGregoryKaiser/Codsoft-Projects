# Stage 1: Build the React application
FROM node:18-alpine as builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Set environment variables for build (e.g., API base URL for production)
# In production, this might point to a public API gateway or proxy
ENV REACT_APP_API_BASE_URL=/api

RUN npm run build

# Stage 2: Serve the application with Nginx (lighter production image)
FROM nginx:alpine

# Remove default Nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom Nginx configuration
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Copy the build output from the builder stage
COPY --from=builder /app/build /usr/share/nginx/html

# Expose port 80 for Nginx
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]