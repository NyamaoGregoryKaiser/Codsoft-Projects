FROM node:20-alpine AS build

WORKDIR /app

COPY frontend/package.json frontend/package-lock.json ./

RUN npm install

COPY frontend/ .

# Use ARG for REACT_APP_API_URL and define it in docker-compose.yml
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL

RUN npm run build

FROM nginx:stable-alpine AS production

COPY --from=build /app/build /usr/share/nginx/html

# Optional: Custom Nginx configuration (e.g., for routing or larger file uploads)
# COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]