# Use a Node.js 18 (LTS) image as the base
FROM node:18-alpine AS build

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application source code
COPY . .

# Build the TypeScript application
RUN npm run build

# Stage 2: Production environment
FROM node:18-alpine

WORKDIR /app

# Copy only necessary files from the build stage
COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/.env.example ./
COPY --from=build /app/ormconfig.ts ./
COPY --from=build /app/src/migrations ./src/migrations
COPY --from=build /app/src/seed.ts ./src/seed.ts # Needed for initial seeding

# Expose the port the app runs on
EXPOSE 5000

# Command to run the application
# For production, we run migrations first, then start the server
# Make sure DB is healthy before running migrations in an actual CI/CD
CMD ["node", "dist/server.js"]