```dockerfile
# Stage 1: Build the Puppeteer dependencies
FROM ghcr.io/puppeteer/puppeteer:latest AS installer

# Stage 2: Build the Node.js application
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy the backend package.json and package-lock.json
COPY package*.json ./

# Install backend dependencies
# This includes `pg` for database, `puppeteer` for scraping
RUN npm install

# Copy the `db` folder with sequelize-cli related files
COPY ../db /app/db

# Copy the rest of the backend application code
COPY src ./src

# Expose the port the app runs on
EXPOSE 5000

# Command to run the application
# For production, prefer `npm start`. For development, `npm run dev` (with nodemon)
CMD ["npm", "start"]
```