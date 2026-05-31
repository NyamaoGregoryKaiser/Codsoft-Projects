```dockerfile
# Stage 1: Build the C++ application
FROM gcc:11 AS builder

WORKDIR /app

# Install dependencies for building
RUN apt-get update && apt-get install -y \
    cmake \
    libpq-dev \
    pkg-config \
    git \
    build-essential \
    libcryptopp-dev # For example CryptoPP, adjust if using other libs

# Copy CMakeLists.txt and source code
COPY CMakeLists.txt .
COPY src ./src
COPY tests ./tests
# No need to copy third_party if using FetchContent

# Build the application
# FetchContent will download dependencies, so internet access is needed here.
RUN cmake -B build -DCMAKE_BUILD_TYPE=Release
RUN cmake --build build -j$(nproc)

# Stage 2: Create a smaller runtime image
FROM debian:stable-slim

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    libstdc++6 \
    # Add any other runtime libraries if needed by CryptoPP or other deps
    && rm -rf /var/lib/apt/lists/*

# Copy the built executable from the builder stage
COPY --from=builder /app/build/zenith-payments .
COPY --from=builder /app/build/tests ./tests # For running tests inside container if needed

# Copy the wait-for-it script
COPY docker/scripts/wait-for-it.sh /usr/local/bin/wait-for-it.sh
RUN chmod +x /usr/local/bin/wait-for-it.sh

# Copy the entrypoint script
COPY docker/scripts/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Create a directory for logs
RUN mkdir -p /app/logs

# Expose the port the application listens on
EXPOSE 8080

# Set the entrypoint to our custom script
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
```