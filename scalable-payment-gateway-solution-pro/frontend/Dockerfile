# Use a Node.js 18 LTS image as the base image for building
FROM node:18-alpine as build

# Set the working directory inside the container
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
FROM nginx:alpine

# Copy the built React app into Nginx's public directory
COPY --from=build /app/frontend/build /usr/share/nginx/html

# Copy custom Nginx configuration (optional, for advanced routing/compression)
# COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 for the frontend
EXPOSE 80

# Command to start Nginx
CMD ["nginx", "-g", "daemon off;"]