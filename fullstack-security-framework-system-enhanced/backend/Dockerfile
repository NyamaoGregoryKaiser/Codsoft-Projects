# Use a Node.js base image
FROM node:20-alpine AS build

# Set working directory
WORKDIR /app

# Copy package.json and pnpm-lock.yaml for pnpm install
COPY package.json pnpm-lock.yaml ./

# Install pnpm globally
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Generate Prisma client and build TypeScript
RUN pnpm prisma generate
RUN pnpm build

# --- Production Stage ---
FROM node:20-alpine AS production

# Set working directory
WORKDIR /app

# Copy pnpm-lock.yaml
COPY pnpm-lock.yaml ./

# Install pnpm globally
RUN npm install -g pnpm

# Only install production dependencies
RUN pnpm install --prod --frozen-lockfile

# Copy built application and prisma client from the build stage
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/.env.example ./.env.example # Example .env for deployment config

# Expose port
EXPOSE 5000

# Run migrations and start the server
CMD ["sh", "-c", "pnpm prisma migrate deploy && node dist/server.js"]