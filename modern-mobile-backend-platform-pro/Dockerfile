```dockerfile
# Stage 1: Build the application
FROM debian:bookworm-slim AS builder

# Install build dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    git \
    libjson-c-dev \
    libpq-dev \
    uuid-dev \
    zlib1g-dev \
    libssl-dev \
    wget \
    pkg-config \
    doxygen \
    lcov \
    ninja-build \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

# Install Drogon from source
# Drogon's installation guide: https://drogon.org/doc/pages/get-started.html#build-from-source
WORKDIR /usr/local/src/drogon
RUN git clone --depth 1 -b master https://github.com/drogonframework/drogon.git . && \
    git submodule update --init && \
    cmake -B build -DCMAKE_BUILD_TYPE=Release && \
    cmake --build build -j$(nproc) && \
    cmake --install build

# Install spdlog from source
WORKDIR /usr/local/src/spdlog
RUN git clone --depth 1 -b v1.12.0 https://github.com/gabime/spdlog.git . && \
    cmake -B build -DCMAKE_BUILD_TYPE=Release && \
    cmake --build build -j$(nproc) && \
    cmake --install build

# Copy source code
WORKDIR /app
COPY . .

# Build the application
RUN cmake -B build -DCMAKE_BUILD_TYPE=Release -DDB_LIB_VERSION=pq && \
    cmake --build build -j$(nproc)

# Stage 2: Create a smaller runtime image
FROM debian:bookworm-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    libjson-c5 \
    libpq5 \
    uuid-runtime \
    libssl3 \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

# Copy the built application from the builder stage
WORKDIR /app
COPY --from=builder /app/build/bin/mobile_backend_app .
COPY --from=builder /app/config config/
COPY --from=builder /app/db db/
COPY --from=builder /app/.env.example .env.example # Just for reference

# Expose the application port
EXPOSE 8080

# Command to run the application
CMD ["./mobile_backend_app"]
```