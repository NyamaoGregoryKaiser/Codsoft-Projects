# Stage 1: Build the React app
FROM node:18-alpine as build-stage

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Pass backend API URL as a build argument
ARG REACT_APP_API_BASE_URL
ENV REACT_APP_API_BASE_URL=${REACT_APP_API_BASE_URL}

RUN npm run build

# Stage 2: Serve the React app with Nginx
FROM nginx:alpine as production-stage

# Copy the built React app from the build stage to Nginx's html directory
COPY --from=build-stage /app/build /usr/share/nginx/html

# Copy custom Nginx configuration (optional, if you have specific needs)
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 for the Nginx server
EXPOSE 80

# The default command for Nginx is `nginx -g 'daemon off;'`, which serves the content.
# No CMD needed unless you want to override it.
```

```