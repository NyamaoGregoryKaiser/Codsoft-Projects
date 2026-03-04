```dockerfile
# Stage 1: Build the C++ application
FROM gcc:12.2.0 as builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y \
    cmake \
    libpqxx-dev \
    libssl-dev \
    pkg-config \
    git \
    build-essential \
    # Clean up APT cache
    && rm -rf /var/lib/apt/lists/*

# Copy CMakeLists.txt and source code
COPY CMakeLists.txt .
COPY src ./src
COPY tests ./tests # Copy tests for build, though not run in final image

# Configure and build
RUN cmake -DCMAKE_BUILD_TYPE=Release .
RUN make -j$(nproc)

# Stage 2: Create the final runtime image
FROM debian:bookworm-slim

WORKDIR /app

# Install runtime dependencies (libpq and libssl)
RUN apt-get update && apt-get install -y \
    libpq5 \
    libssl3 \
    # Clean up APT cache
    && rm -rf /var/lib/apt/lists/*

# Copy the built executable from the builder stage
COPY --from=builder /app/OptiDB ./OptiDB
COPY --from=builder /app/db_migrations ./db_migrations

# Copy the entrypoint script
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Expose the application port
EXPOSE 18080

# Set the entrypoint
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

# Default command (can be overridden)
CMD ["./OptiDB"]
```