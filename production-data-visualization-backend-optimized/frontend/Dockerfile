```dockerfile
# Stage 1: Build the React application
FROM node:18-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY .env.example .
COPY public ./public
COPY src ./src

# Use the REACT_APP_API_BASE_URL from the build context (from .env)
ARG REACT_APP_API_BASE_URL
ENV REACT_APP_API_BASE_URL=${REACT_APP_API_BASE_URL}

RUN npm run build

# Stage 2: Serve the application with Nginx (for production)
FROM nginx:alpine AS production

COPY --from=build /app/build /usr/share/nginx/html

# Optional: Custom Nginx configuration
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

# For local development with 'docker-compose up', the `command: npm start` in docker-compose.yml
# will override this, running the React dev server directly from the mounted volume.
# The 'production' stage here is primarily for a dedicated production deployment build.
```