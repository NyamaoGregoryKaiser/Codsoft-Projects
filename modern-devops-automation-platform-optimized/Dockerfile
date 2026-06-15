```dockerfile
# Stage 1: Build the C++ application
FROM gcc:10.3 as builder

# Install build dependencies
RUN apt-get update && apt-get install -y \
    cmake \
    libpq-dev \
    libjsoncpp-dev \
    uuid-dev \
    git \
    build-essential \
    libssl-dev \
    drogon-dev \
    libpoco-dev \
    libgtest-dev # For building tests, if run in this stage

# Set working directory
WORKDIR /app

# Copy source code
COPY . .

# Build Drogon if not using system-installed or if version specific.
# For simplicity, we assume system-installed drogon-dev satisfies this or it's built externally.
# If building drogon from source:
# RUN git clone https://github.com/drogonframework/drogon.git && \
#     cd drogon && \
#     git submodule update --init && \
#     mkdir build && cd build && \
#     cmake .. && make -j$(nproc) && make install

# Build application
RUN mkdir build
WORKDIR /app/build
RUN cmake ..
RUN make -j$(nproc)

# Stage 2: Create a smaller runtime image
FROM debian:bullseye-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    libjsoncpp25 \
    uuid-runtime \
    libssl1.1 \
    drogon \
    libpoco-foundation90 \
    libpoco-util90 \
    libpoco-json90 \
    drogon-lib \
    drogon-ctl \
    drogon-dev \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy the built executable from the builder stage
COPY --from=builder /app/build/ProductCatalogService /app/ProductCatalogService
COPY --from=builder /app/config/app_config.json /app/config/app_config.json
COPY --from=builder /app/web /app/web # Copy web assets for static serving

# Expose the port the application listens on
EXPOSE 8080

# Environment variables (can be overridden by docker-compose or Kubernetes)
ENV APP_PORT=8080
ENV APP_LOG_LEVEL=INFO
ENV JWT_SECRET=superSecretKeyForProductCatalogService

# Command to run the application
CMD ["./ProductCatalogService"]
```