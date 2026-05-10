```dockerfile
# Stage 1: Build the application
FROM debian:bookworm-slim AS builder

LABEL maintainer="Your Name <your.email@example.com>"

# Install build dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        build-essential \
        cmake \
        git \
        libsqlite3-dev \
        libssl-dev \
        libargon2-dev \
        ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy CMakeLists.txt and source code
COPY CMakeLists.txt .
COPY src ./src
COPY tests ./tests # Copy tests for the build stage to run them

# Build the application
RUN cmake -B build -DCMAKE_BUILD_TYPE=Release && \
    cmake --build build --target AuthSystem && \
    cmake --build build --target AuthSystemTests && \
    ./build/AuthSystemTests # Run tests during build

# Stage 2: Create a minimal runtime image
FROM debian:bookworm-slim

# Install runtime dependencies (if any not already in base image)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        libsqlite3-0 \
        libssl3 \
        libargon2-1 \
        ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Create data directory
RUN mkdir -p /app/data

# Copy the built executable from the builder stage
COPY --from=builder /app/build/AuthSystem .
COPY --from=builder /app/build/migrations ./migrations

# Copy .env.example for reference (DO NOT ship real .env with secrets)
COPY .env.example .

# Expose the application port
EXPOSE 8080

# Command to run the application
# Use entrypoint to ensure environment variables are loaded if using a wrapper script
CMD ["./AuthSystem"]
```