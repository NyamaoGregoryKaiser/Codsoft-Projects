```dockerfile
# Stage 1: Build the NestJS application
FROM node:18-alpine AS builder

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .

# Generate Prisma client during build
RUN yarn prisma generate

# Build NestJS app
RUN yarn build

# Stage 2: Run the NestJS application
FROM node:18-alpine AS runner

WORKDIR /app

# Install only production dependencies
COPY --from=builder /app/package.json /app/yarn.lock ./
RUN yarn install --production --frozen-lockfile

COPY --from=builder /app/node_modules/.prisma /app/node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma /app/node_modules/@prisma
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY .env.example .env.development .env.production ./

ENV NODE_ENV production
ENV PORT 3000

EXPOSE 3000

CMD ["node", "dist/main"]
```