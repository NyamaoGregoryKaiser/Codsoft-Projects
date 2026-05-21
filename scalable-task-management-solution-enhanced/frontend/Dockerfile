# Stage 1: Build the React application
FROM node:18-alpine AS builder

WORKDIR /app/frontend

COPY package.json yarn.lock ./
# Copy all project files
COPY . .

# Install dependencies
RUN yarn install --frozen-lockfile

# Build the React app
RUN yarn build

# Stage 2: Serve the application with Nginx
FROM nginx:alpine

# Remove default Nginx configuration
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom Nginx configuration
COPY nginx/nginx.conf /etc/nginx/conf.d/taskflow.conf

# Copy the built React app from the builder stage
COPY --from=builder /app/frontend/build /usr/share/nginx/html

# Expose port 80 (Nginx default)
EXPOSE 80

# Command to run Nginx
CMD ["nginx", "-g", "daemon off;"]