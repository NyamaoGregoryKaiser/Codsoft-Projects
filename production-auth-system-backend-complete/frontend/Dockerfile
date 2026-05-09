# Use a Node.js base image for building the React app
FROM node:18-alpine AS builder

# Set the working directory
WORKDIR /app/frontend

# Copy package.json and package-lock.json (if exists)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the React app for production
RUN npm run build

# Use Nginx to serve the static build files
FROM nginx:alpine

# Copy the Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built React app from the builder stage
COPY --from=builder /app/frontend/build /usr/share/nginx/html

# Expose port 80 (Nginx default)
EXPOSE 80

# Command to start Nginx
CMD ["nginx", "-g", "daemon off;"]
```