# Build stage
FROM node:18-alpine AS build_stage

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=build_stage /app/build /usr/share/nginx/html

# Copy custom nginx config if needed (e.g., for routing or proxying to backend)
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```