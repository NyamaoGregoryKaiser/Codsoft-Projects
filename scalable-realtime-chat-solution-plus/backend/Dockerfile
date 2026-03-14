```dockerfile
# Use an official Node.js runtime as the base image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (if available) to the working directory
COPY package*.json ./

# Install project dependencies
# Use `npm ci` for clean installs in CI/CD environments to ensure exact versions
RUN npm ci

# Copy the rest of the application code to the working directory
COPY . .

# Expose the port the app runs on (matching your backend config.port)
EXPOSE 5000

# Define environment variables (can be overridden by docker-compose or Kubernetes)
ENV NODE_ENV=production
ENV PORT=5000
ENV JWT_SECRET=your_production_jwt_secret_here
ENV DB_HOST=postgres_db # Name of the PostgreSQL service in docker-compose
ENV DB_PORT=5432
ENV DB_NAME=chat_app_prod_db
ENV DB_USER=prod_user
ENV DB_PASSWORD=prod_password
ENV REDIS_HOST=redis_cache # Name of the Redis service in docker-compose
ENV REDIS_PORT=6379
ENV REDIS_PASSWORD=

# Run database migrations before starting the app
# Consider separating this into an init script for more robust deployments
CMD npm run migrate && npm run start
```