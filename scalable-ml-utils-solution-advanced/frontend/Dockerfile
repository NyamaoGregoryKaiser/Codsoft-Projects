# Stage 1: Build the React application
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json .
COPY package-lock.json .
RUN npm install

COPY . .

# Build the app for production
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:alpine

# Copy the build output from the builder stage
COPY --from=builder /app/build /usr/share/nginx/html

# Expose port 80 (default HTTP port for Nginx)
EXPOSE 80

# The default command runs Nginx
CMD ["nginx", "-g", "daemon off;"]