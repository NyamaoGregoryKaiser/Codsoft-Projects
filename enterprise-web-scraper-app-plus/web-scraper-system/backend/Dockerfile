```dockerfile
# Stage 1: Build TypeScript
FROM node:18-alpine AS builder

WORKDIR /app

COPY package.json yarn.lock ./
COPY tsconfig.json ./

# Install dependencies (including devDependencies for build)
RUN yarn install --frozen-lockfile

COPY . .

# Build TypeScript to JavaScript
RUN yarn build

# Stage 2: Run application
FROM node:18-alpine

WORKDIR /app

# Copy built application and production dependencies
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/yarn.lock ./yarn.lock
COPY --from=builder /app/prisma ./prisma/ # Copy prisma folder
COPY --from=builder /app/node_modules ./node_modules # Copy node_modules from builder (contains production deps)

# Install Prisma Client (postinstall hook does this usually)
RUN npx prisma generate --data-proxy false

# Copy the pre-start script and make it executable
COPY ./pre-start.sh /app/pre-start.sh
RUN chmod +x /app/pre-start.sh

EXPOSE 5000

# The `command` in docker-compose will run pre-start.sh
CMD ["node", "dist/app.js"]
```