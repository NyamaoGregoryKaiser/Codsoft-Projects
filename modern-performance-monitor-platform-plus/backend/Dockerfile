```dockerfile
# Use an official Node.js runtime as the base image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock) to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install --production

# If you have dev dependencies for tests or build steps, you might install them conditionally
# RUN npm install

# Copy the rest of the application code
COPY . .

# Ensure the start.sh script is executable
RUN chmod +x start.sh

# Expose the port the app runs on
EXPOSE 5000

# Command to run the application (start.sh handles migrations and then starts the server)
# CMD ["npm", "start"] # This would be if no migrations/seeds in Docker
ENTRYPOINT ["./start.sh"]
```