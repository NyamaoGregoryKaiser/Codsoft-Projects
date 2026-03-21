# Stage 1: Build the React application
FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ENV REACT_APP_API_BASE_URL=http://localhost:5000/api/v1 # Set default for build process
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:alpine

# Copy the build output from the previous stage to Nginx's public directory
COPY --from=build /app/build /usr/share/nginx/html

# Copy custom Nginx configuration (optional, if you need specific routing/headers)
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# The default command runs Nginx
CMD ["nginx", "-g", "daemon off;"]