```dockerfile
# Stage 1: Build the TypeScript application
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package.json and install dependencies
COPY package.json ./
COPY tsconfig.json ./
RUN npm install

# Copy source code and build
COPY src ./src
RUN npm run build

# Stage 2: Run the application
FROM node:18-alpine

WORKDIR /app

# Copy only production dependencies and built code
COPY package.json ./
RUN npm install --only=production

COPY --from=builder /app/dist ./dist
COPY .env.example ./.env # For production, consider using external secret management or passing env vars directly

EXPOSE 5000

# Health check (optional, but good for production)
HEALTHCHECK --interval=30s --timeout=10s --retries=3 CMD curl --fail http://localhost:5000/api/v1/health || exit 1

CMD ["npm", "start"]
```