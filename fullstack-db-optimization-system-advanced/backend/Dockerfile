# Use a lightweight Node.js base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Expose the port the app runs on
EXPOSE 5000

# Command to run the application (in production, use `npm start`)
# For development with nodemon, use `npm run dev` in docker-compose
CMD ["npm", "start"]
```

#### `frontend/Dockerfile`
```dockerfile