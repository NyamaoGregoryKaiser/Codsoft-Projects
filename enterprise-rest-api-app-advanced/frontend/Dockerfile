# Stage 1: Build the React application
FROM node:18-alpine AS build

WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock) to leverage Docker cache
COPY package.json ./
# If using yarn, replace above with COPY yarn.lock ./

# Install dependencies
RUN npm install
# If using yarn, replace above with: RUN yarn install

# Copy the rest of the application code
COPY . .

# Build the React app for production
# Ensure Tailwind CSS is built before react-scripts build
RUN npm run tailwind:build && npm run build

# Stage 2: Serve the application with Nginx (for production) or simply copy to a lightweight server
# For simplicity and Docker Compose local dev, we'll use a simple HTTP server.
# In a real production scenario, you might use Nginx or serve directly from the Spring Boot app
# if it's a monolithic deployment.
FROM alpine AS runtime

WORKDIR /usr/share/nginx/html

# Install Nginx
RUN apk update && apk add nginx && rm -rf /var/cache/apk/*

# Copy the built React app from the build stage
COPY --from=build /app/build .

# Remove default Nginx config and add a simple one to serve React app
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]

# If you prefer not to use Nginx in Docker Compose for simple dev setup
# (and rely on React-scripts dev server or serve from backend for production),
# you can use a very basic web server.
# FROM alpine
# WORKDIR /app
# RUN apk add --no-cache python3
# COPY --from=build /app/build ./build
# EXPOSE 3000
# CMD ["python3", "-m", "http.server", "--directory", "build", "3000"]

# nginx.conf (place in frontend/ directory)
# This is required for the Nginx based Dockerfile
# ```nginx
# server {
#   listen 80;
#   server_name localhost;
#   root /usr/share/nginx/html;
#   index index.html;
#
#   location / {
#     try_files $uri $uri/ /index.html;
#   }
# }
# ```
```

**`frontend/nginx.conf`**
```nginx