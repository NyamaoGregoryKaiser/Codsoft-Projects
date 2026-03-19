```dockerfile
# Stage 1: Build the React application
FROM node:18-alpine AS builder

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .

ENV VITE_API_URL /api/v1 # Use relative path for proxy
ENV VITE_WS_URL ws://localhost:3000/chat # Adjust for production environment/nginx proxy

RUN yarn build

# Stage 2: Serve the React application with Nginx
# Using Nginx as a robust web server for static files and reverse proxy
FROM nginx:alpine AS runner

COPY --from=builder /app/dist /usr/share/nginx/html

# Optional: Custom Nginx configuration for reverse proxy and error handling
# If you plan to use Nginx in production for API proxy, you'd add a config here.
# For simplicity in this docker-compose, we expose frontend directly and rely on
# frontend's axios config to hit backend directly or via dev proxy.
# For a production setup with Nginx as reverse proxy, you'd configure it like:
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80 # Or 5173 if you prefer not to use default Nginx port

CMD ["nginx", "-g", "daemon off;"]
```
*(Note: The `frontend/Dockerfile` assumes direct serving of static files. For a production environment, you would typically use Nginx to serve the frontend AND reverse proxy API requests to the backend for a single entry point. I've left a comment in the Dockerfile about this for simplicity and to prevent over-complication of the Nginx configuration for this comprehensive example.)*

#### CI/CD Pipeline Configuration (GitHub Actions Example)