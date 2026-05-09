# Use a Node.js base image
FROM node:20-alpine AS builder

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Generate Prisma client (important for `npm run build` after copying source)
RUN npx prisma generate

# Build the TypeScript project
RUN npm run build

# --- Production Image ---
FROM node:20-alpine

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json to install only production dependencies
COPY package*.json ./

# Install only production dependencies
RUN npm install --only=production

# Copy the built application from the builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/.env ./.env

# Expose the port the app runs on
EXPOSE 3000

# Run database migrations before starting the app
# CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
# For development/testing with docker-compose, we use `depends_on` in compose file
# and often run migrations manually or as part of a separate script.
# For production, `migrate deploy` is critical.
# For this comprehensive example, we'll keep `migrate deploy` in the `entrypoint.sh` for flexibility.
COPY entrypoint.sh .
RUN chmod +x entrypoint.sh

ENTRYPOINT ["./entrypoint.sh"]
CMD ["node", "dist/server.js"]