# Use a Node.js 18 Alpine image as the base
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock) to the working directory
# This allows caching of dependencies layer
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of the application code to the working directory
COPY . .

# Expose the port the app runs on
ARG PORT=5000
EXPOSE ${PORT}

# Set environment variables for production (can be overridden by docker-compose or Kubernetes)
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
ENV PORT=${PORT}

# Run database migrations and seeds (typically done in a dedicated CI/CD step or init container)
# For simplicity in this docker-compose example, we run it here.
# In production, this command should be carefully managed as part of deployment.
# RUN npx sequelize-cli db:migrate && npx sequelize-cli db:seed:all

# Command to run the application
CMD ["node", "src/server.js"]
```

```