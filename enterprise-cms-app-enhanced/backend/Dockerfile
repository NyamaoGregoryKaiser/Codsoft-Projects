# Use a Node.js base image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Create the uploads directory for media storage
RUN mkdir -p uploads

# Expose the port the app runs on
EXPOSE 5000

# Command to run the application (migrations/seeders can be run before in docker-compose)
CMD ["npm", "start"]