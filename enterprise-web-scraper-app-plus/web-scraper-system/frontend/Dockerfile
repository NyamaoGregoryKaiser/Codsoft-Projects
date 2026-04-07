```dockerfile
# Stage 1: Build the React application
FROM node:18-alpine AS builder

WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn install --frozen-lockfile

COPY . .

ENV REACT_APP_API_BASE_URL=$REACT_APP_API_BASE_URL # Pass env var from docker-compose

RUN yarn build

# Stage 2: Serve the application with Nginx or a simple Node server (for this example, just outputting build)
# For a production scenario, you'd typically serve this with Nginx or a similar web server.
# Here, we'll keep it simple to just serve with a simple Node.js static server if needed,
# or rely on `npm start` which is configured for local dev but can be adapted.

FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/build ./build
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

# Command to serve the static build (can be replaced by Nginx setup)
# For production, consider `npm install -g serve` and `CMD ["serve", "-s", "build"]`
# For dev/hot-reload via docker-compose, `npm start` is used which spins up dev server.
EXPOSE 3000

# By default, the `npm start` command will be used from docker-compose.yml
CMD ["npm", "start"]
```