# Stage 1: Build the React application
FROM node:18-alpine as builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

RUN npm run build

# Stage 2: Serve the application with Nginx (for production)
# For development, we'll use `npm run dev` in docker-compose, 
# but this shows a production Dockerfile.
FROM nginx:alpine as runner

COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration (optional)
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
```