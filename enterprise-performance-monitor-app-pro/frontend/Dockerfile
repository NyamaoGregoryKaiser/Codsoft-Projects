# Use Node.js for building the React app
FROM node:20-alpine AS builder

WORKDIR /app/frontend

COPY package*.json ./
RUN npm install

COPY . .

# Build the React app
RUN npm run build

# --- Production Stage ---
# Use Nginx to serve the static files
FROM nginx:alpine

# Copy the build output to Nginx's public directory
COPY --from=builder /app/frontend/build /usr/share/nginx/html

# Copy custom Nginx configuration (optional, if you have one)
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]