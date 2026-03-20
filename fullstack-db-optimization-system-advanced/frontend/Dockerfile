# Build stage
FROM node:18-alpine as build-stage

WORKDIR /app

COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine as production-stage
COPY --from=build-stage /app/build /usr/share/nginx/html
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
```

#### `backend/.dockerignore`
```