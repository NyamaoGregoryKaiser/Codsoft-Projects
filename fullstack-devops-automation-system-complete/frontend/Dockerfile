```dockerfile
# Stage 1: Build the React application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package.json and package-lock.json first to leverage Docker cache
COPY package.json yarn.lock* package-lock.json* ./

# Install dependencies
RUN npm install --frozen-lockfile

# Copy the rest of the application source code
COPY . .

# Build the React app
# Ensure VITE_API_BASE_URL is set if needed during build (e.g. for static data or prod endpoint)
# It's better to configure this in Nginx or at runtime in the frontend code
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build


# Stage 2: Serve the application with Nginx
FROM nginx:stable-alpine AS runner

# Copy the Nginx configuration
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Remove default Nginx static content
RUN rm -rf /usr/share/nginx/html/*

# Copy the build output from the builder stage to Nginx's public directory
COPY --from=builder /app/build /usr/share/nginx/html

# Expose port 80 (Nginx default)
EXPOSE 80

# The default command for Nginx will start the server
CMD ["nginx", "-g", "daemon off;"]
```