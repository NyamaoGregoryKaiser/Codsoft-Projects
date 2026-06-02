# Stage 1: Build the React application
FROM node:18-alpine as builder

WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock)
COPY package.json .npmrc ./

# Install dependencies
RUN npm install

# Copy the rest of the application source
COPY . ./

# Build the React app for production
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:alpine

# Copy the built React app from the builder stage to Nginx's public directory
COPY --from=builder /app/build /usr/share/nginx/html

# Copy a custom Nginx configuration (optional, but good practice for SPAs)
# If you don't have a custom config, Nginx will use its default config.
# For SPAs, you often need to rewrite all unknown paths to index.html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]