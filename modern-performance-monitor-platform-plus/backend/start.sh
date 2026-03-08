```bash
#!/bin/sh

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL..."
/usr/bin/wait-for-it.sh db:5432 -t 30 -- echo "PostgreSQL is up!"

# Wait for Redis to be ready
echo "Waiting for Redis..."
/usr/bin/wait-for-it.sh redis:6379 -t 30 -- echo "Redis is up!"

# Run migrations
echo "Running database migrations..."
npm run migrate

# Run seeds (optional, for initial data)
echo "Running database seeds..."
npm run seed

# Start the Node.js application
echo "Starting Node.js application..."
npm start
```
*Note: `wait-for-it.sh` is a script typically added to Docker images to ensure services are available before proceeding. For this example, you'd need to add it to your `Dockerfile` or ensure it's available in the `node:18-alpine` image or build it in.*
*To add `wait-for-it.sh` to the Dockerfile:*
```dockerfile
# ... existing Dockerfile content ...

# Install wait-for-it.sh (or similar script)
RUN apk add --no-cache curl \
    && curl -LO https://github.com/vishnubob/wait-for-it/raw/master/wait-for-it.sh \
    && chmod +x wait-for-it.sh \
    && mv wait-for-it.sh /usr/bin/wait-for-it.sh

# ... rest of Dockerfile ...
```