# --- Stage 1: Build the React application ---
FROM node:18-alpine AS build

WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock)
COPY frontend-react/package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY frontend-react .

# Build the React app
RUN npm run build

# --- Stage 2: Serve the React application with Nginx ---
FROM nginx:alpine AS runtime

# Copy the built React app from the build stage to Nginx's html directory
COPY --from=build /app/build /usr/share/nginx/html

# Copy custom Nginx configuration
COPY frontend-react/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 for the Nginx server
EXPOSE 80

# The default command runs Nginx
CMD ["nginx", "-g", "daemon off;"]
```