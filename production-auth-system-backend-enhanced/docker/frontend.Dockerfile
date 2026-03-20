# Use a Node.js base image for building
FROM node:18-alpine as build

# Set the working directory
WORKDIR /app/frontend

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the React application
ENV REACT_APP_API_BASE_URL=/api/v1 # Use relative path when served by nginx or proxy
RUN npm run build

# Use Nginx to serve the static files
FROM nginx:alpine

# Copy custom Nginx configuration
COPY ./nginx/default.conf /etc/nginx/conf.d/default.conf

# Copy the built React app to Nginx's public directory
COPY --from=build /app/frontend/build /usr/share/nginx/html

# Expose the port Nginx will listen on
EXPOSE 80

# Command to run Nginx
CMD ["nginx", "-g", "daemon off;"]