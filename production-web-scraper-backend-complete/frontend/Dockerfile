FROM node:20-alpine AS build

WORKDIR /app

COPY package.json .
COPY package-lock.json .
RUN npm ci

COPY . .

ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

FROM nginx:stable-alpine AS production

COPY --from=build /app/dist /usr/share/nginx/html

# Optional: Add Nginx configuration for SPA routing (e.g., if you have client-side routes)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

**Note**: You'll need an `nginx.conf` file in your `frontend/` directory for production. Here's a basic one for React SPAs:
```nginx
# frontend/nginx.conf
server {
    listen 80;
    server_name localhost; # Or your domain name

    root /usr/share/nginx/html;
    index index.html index.htm;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Optional: Serve API requests through Nginx to backend service
    # If your frontend and backend are on the same domain/subdomain,
    # this can simplify CORS handling.
    # For this project, we assume VITE_API_BASE_URL points directly to backend.
    # If you want to proxy:
    # location /api/v1/ {
    #     proxy_pass http://backend:8000/api/v1/;
    #     proxy_set_header Host $host;
    #     proxy_set_header X-Real-IP $remote_addr;
    #     proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    # }
}
```
---