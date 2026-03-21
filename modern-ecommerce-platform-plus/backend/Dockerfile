# Use a Node.js 18 LTS image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (if available)
# to leverage Docker cache for dependencies
COPY package*.json ./

# Install dependencies
# Using npm ci ensures deterministic installs (uses package-lock.json)
RUN npm ci --only=production

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 5000

# Set environment variables (optional, but good for clarity)
ENV NODE_ENV=production
ENV PORT=5000

# Command to run the application
CMD ["node", "src/server.js"]