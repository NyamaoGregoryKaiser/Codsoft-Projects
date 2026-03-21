```dockerfile
# Use a Node.js base image
FROM node:20-alpine as builder

# Set working directory
WORKDIR /app/frontend

# Copy package.json and install dependencies
COPY package.json .
COPY yarn.lock .  # If you use yarn
RUN yarn install --frozen-lockfile # Or `npm ci` if using npm

# Copy the rest of the application code
COPY . .

# Build the React application
RUN yarn build # Or `npm run build`

# Use Nginx to serve the built React app
FROM nginx:alpine

# Copy Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built React app to Nginx html directory
COPY --from=builder /app/frontend/build /usr/share/nginx/html

# Expose port 80 for the frontend
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
```