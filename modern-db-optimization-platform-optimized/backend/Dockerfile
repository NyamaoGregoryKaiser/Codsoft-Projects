# Use a Node.js 18 LTS image as the base
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app/backend

# Copy package.json and package-lock.json to install dependencies
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the frontend (if it were part of the same Dockerfile, but it's separate)
# For the backend, no explicit build step for JS, just ensure dependencies are there.

# Expose the port the app runs on
EXPOSE 5000

# Run database migrations and seeds (important for Docker setup)
# This is a simple approach. For production, consider a separate migration container/job.
RUN npx knex migrate:latest --knexfile knexfile.js --env production
RUN npx knex seed:run --knexfile knexfile.js --env production

# Command to run the application
CMD ["npm", "start"]