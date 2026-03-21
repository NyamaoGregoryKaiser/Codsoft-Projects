# Use the official Node.js image as the base image
FROM node:20-alpine AS builder

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (if available) to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code to the working directory
COPY . .

# Build the Next.js application
RUN npm run build

# Use a smaller image for the production server
FROM node:20-alpine AS runner

WORKDIR /app

# Copy the built application from the builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# Expose the port Next.js will run on
EXPOSE 3000

# Set environment variables for Next.js in production
# These should ideally come from your deployment environment
ENV NODE_ENV=production
# NEXT_PUBLIC_BACKEND_URL is picked up at build time for client-side code
# For runtime env vars, you might need a different strategy (e.g., config file or server-side rendering)

# Command to run the application
CMD ["npm", "start"]