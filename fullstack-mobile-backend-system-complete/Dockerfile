```dockerfile
# Stage 1: Build - Install dependencies
FROM node:18-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
# If you use yarn, copy yarn.lock instead of package-lock.json
# COPY yarn.lock ./

RUN npm install --production=false
# If you use yarn: RUN yarn install --frozen-lockfile

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Stage 2: Production - Copy only necessary files
FROM node:18-alpine AS production

WORKDIR /app

# Copy production dependencies and Prisma client from builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma/client ./prisma/client
COPY --from=builder /app/package.json ./package.json

# Copy source code
COPY --from=builder /app/src ./src
COPY --from=builder /app/prisma/schema.prisma ./prisma/schema.prisma
COPY --from=builder /app/.env.example ./.env.example # Useful for reference

# Expose the port the app runs on
EXPOSE 3000

# Run Prisma migrations when the container starts
# This is generally suitable for small to medium applications or
# CI/CD environments. For large-scale production, manage migrations
# more carefully (e.g., as a separate step in your deployment pipeline)
# before the app service starts.
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
```