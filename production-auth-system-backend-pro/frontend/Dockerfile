```dockerfile
# Stage 1: Build the React application
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json .
COPY yarn.lock .
RUN yarn install --frozen-lockfile # Install dependencies
COPY . .
RUN yarn build # Build the application

# Stage 2: Serve the React application with Nginx
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
# Copy custom Nginx configuration to enable proxying to backend
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```