# Stage 1: Build the React application
FROM node:18-alpine AS build

WORKDIR /app

COPY package.json ./
COPY yarn.lock ./  # If you use yarn, otherwise remove this line
COPY tsconfig.json ./
COPY .env.example ./.env # Copy .env.example to .env for build process to pick up env vars

RUN npm install # Or yarn install

COPY . .

RUN npm run build # Or yarn build

# Stage 2: Serve the static files with Nginx
FROM nginx:alpine

# Copy the built React app from the build stage
COPY --from=build /app/build /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 (Nginx default)
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```