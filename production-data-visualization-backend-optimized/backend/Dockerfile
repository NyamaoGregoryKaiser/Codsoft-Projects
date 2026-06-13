```dockerfile
# Stage 1: Build the TypeScript application
FROM node:18-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY tsconfig.json .
COPY src ./src
COPY database ./database

RUN npm run build

# Stage 2: Run the application
FROM node:18-alpine AS production

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install --omit=dev # Install only production dependencies

COPY --from=build /app/dist ./dist
COPY --from=build /app/database ./database
COPY --from=build /app/.env.example ./

# Create data directory for SQLite DB and uploaded files
RUN mkdir -p data

EXPOSE 5000

CMD ["node", "dist/server.js"]
```