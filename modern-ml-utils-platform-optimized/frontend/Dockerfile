# Stage 1: Build the React application
FROM node:18-alpine AS build

WORKDIR /app

COPY package.json yarn.lock* package-lock.json* ./
RUN npm install --frozen-lockfile

COPY . .

ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

# Stage 2: Serve the application with Nginx (for production-readiness)
# For simplicity and to match the port specified in docker-compose, we will use a simple Node.js static server
# In a real production scenario, you'd likely use Nginx or Caddy to serve static files.
FROM node:18-alpine

WORKDIR /app

COPY --from=build /app/dist ./dist
COPY --from=build /app/.env.example ./.env.example

# Install a lightweight http-server to serve the static files
RUN npm install -g serve

EXPOSE 3000

CMD ["serve", "-s", "dist", "-l", "3000"]