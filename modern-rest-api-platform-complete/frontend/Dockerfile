# Multi-stage build for a lean production image for React frontend

# --- STAGE 1: Build the React application ---
FROM node:16-alpine AS builder

WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock)
COPY package.json ./
COPY yarn.lock ./ # or package-lock.json if using npm

# Install dependencies
RUN yarn install --frozen-lockfile # or npm ci

# Copy the rest of the frontend code
COPY . .

# Build the React app
RUN yarn build # or npm run build

# --- STAGE 2: Serve the React application with Nginx ---
FROM nginx:alpine AS production

# Copy Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built React app to Nginx's public directory
COPY --from=builder /app/build /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Command to start Nginx
CMD ["nginx", "-g", "daemon off;"]
```