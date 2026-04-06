# Use a Node.js 18 LTS image as the base for building
FROM node:18-alpine as build-stage

WORKDIR /app/frontend

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the React application
RUN npm run build

# Use a lightweight Nginx image to serve the static files in production
FROM nginx:stable-alpine as production-stage

# Copy the Nginx configuration
COPY nginx/nginx.conf /etc/nginx/nginx.conf

# Remove default Nginx welcome page
RUN rm -rf /etc/nginx/conf.d/*

# Copy the built React app to the Nginx html directory
COPY --from=build-stage /app/frontend/build /usr/share/nginx/html

# Expose port 80 for web traffic
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]