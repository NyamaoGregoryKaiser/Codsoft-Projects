# Use a Node.js 20 LTS Alpine image for smaller size
FROM node:20-alpine as development

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the NestJS application
RUN npm run build

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD [ "npm", "run", "start:prod" ]


# Stage for production environment (optional, for multi-stage build optimization)
FROM node:20-alpine as production

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --only=production

COPY --from=development /usr/src/app/dist ./dist

EXPOSE 3000
CMD [ "node", "dist/main" ]