# Use a Node.js 18 LTS image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Ensure Puppeteer's dependencies are installed
# This is crucial for running Puppeteer in a Docker container
RUN apk add --no-cache chromium nss freetype freetype-dev harfbuzz ca-certificates ttf-freefont
# Note: A separate build stage or a more specific Chromium/Puppeteer image
# might be needed for production for smaller image size and better security.
# For simplicity, this alpine setup is functional.

# Expose the port the app runs on
EXPOSE 5000

# Command to run the application
# In development, you might use `npm run dev` with nodemon
# For production, `npm start` (which runs `node src/server.js`)
CMD ["npm", "start"]