```dockerfile
# Stage 1: Build the React application
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package.json and install dependencies
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Build the React app
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}
RUN yarn build

# Stage 2: Serve the application with Nginx
FROM nginx:alpine AS production

# Copy Nginx configuration
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
# Note: In the root docker-compose.yml, we override this with the project's nginx/default.conf
# and mount the build output from the frontend service, making this stage's config redundant
# if building separately and then mounting in docker-compose.
# However, this Dockerfile can be used for a standalone frontend container.

# Copy the build output from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```