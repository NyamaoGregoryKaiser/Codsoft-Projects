# Stage 1: Build the React application
FROM node:18-alpine as build-stage

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

# Stage 2: Serve the application with Nginx (or just run directly with Express/Serve)
# For simplicity, we'll use a smaller Alpine Node image to serve directly with 'serve'
# or in a production setting, you'd usually use Nginx or an optimized server.
FROM node:18-alpine as production-stage

WORKDIR /app

# Copy the built React app from the build stage
COPY --from=build-stage /app/build ./build

# Install a static file server if not using Nginx
RUN npm install -g serve

# Expose the port (e.g., 3000 by default for 'serve')
EXPOSE 3000

# Command to serve the application
CMD ["serve", "-s", "build", "-l", "3000"]