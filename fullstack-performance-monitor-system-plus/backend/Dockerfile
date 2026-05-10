# Stage 1: Build the TypeScript application
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev # Install only production dependencies

COPY . .
RUN npx prisma generate # Generate Prisma client
RUN npx tsc # Compile TypeScript

# Stage 2: Create the final production image
FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/.env.example ./.env.example # Copy example for reference, .env should be managed externally
# If you are including .env directly in the image (not recommended for secrets)
# COPY --from=builder /app/.env ./.env

EXPOSE 5000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]