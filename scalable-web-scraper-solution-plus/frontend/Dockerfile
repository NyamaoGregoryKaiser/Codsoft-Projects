```dockerfile
# Stage 1: Build the React application
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

# Stage 2: Serve the application with Nginx (for production)
# For development, we'll just run `npm start`
FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/build ./build
COPY package*.json ./
COPY .env ./

# Install only production dependencies for running the app, e.g., serve or react-scripts start
RUN npm install --only=production

EXPOSE 3000

# For development, you'd typically run `npm start`
# For production, you'd serve the build directory using something like `serve` or Nginx
CMD ["npm", "start"]
```