```dockerfile
# Stage 1: Install dependencies and build the Next.js application
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json yarn.lock* ./
RUN yarn install --frozen-lockfile --production=false

COPY . .

# Disable telemetry if desired
ENV NEXT_TELEMETRY_DISABLED 1

# Build the Next.js app
RUN yarn build

# Stage 2: Serve the Next.js application with a minimal image
FROM node:20-alpine AS runner

WORKDIR /app

# Set environment variables for Next.js build
ENV NODE_ENV=production
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}
ENV PORT=3000

# Copy necessary files from the builder stage
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

# Command to start the Next.js app
CMD ["yarn", "start"]
```