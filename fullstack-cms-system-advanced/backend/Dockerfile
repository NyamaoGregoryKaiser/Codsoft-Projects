# Use a Node.js 20 base image
FROM node:20-alpine AS build

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json to install dependencies
COPY package*.json ./

# Install dependencies, including devDependencies for building
RUN npm install

# Copy the rest of the application source code
COPY . .

# Build the TypeScript application
RUN npm run build

# --- Production Stage ---
FROM node:20-alpine

# Set the working directory
WORKDIR /app

# Copy package.json to install only production dependencies
COPY package*.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Copy build artifacts from the build stage
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
# Copy .env.example (or actual .env for simpler docker setups, but better practice is volume or env vars)
# COPY --from=build /app/.env.example ./.env.example

# Expose the port the app runs on
EXPOSE 5000

# Set NODE_ENV to production
ENV NODE_ENV=production

# Command to run the application
CMD [ "node", "dist/server.js" ]