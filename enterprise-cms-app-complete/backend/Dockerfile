# Use a Node.js 18 image as a base
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (if available) to the working directory
# This allows caching of node_modules layer
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code to the working directory
COPY . .

# Create directory for uploads and logs, ensure correct permissions
RUN mkdir -p uploads logs && chmod -R 777 uploads logs

# Expose the port the app runs on
EXPOSE 5000

# Command to run the application
CMD ["npm", "start"]