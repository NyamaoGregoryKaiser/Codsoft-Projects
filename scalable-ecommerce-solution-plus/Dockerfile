```dockerfile
# Stage 1: Build C++ application
FROM conanio/gcc11:1.59.0 AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y \
    cmake \
    libpq-dev \
    # ... other dependencies like libssl-dev for OpenSSL, etc.
    && rm -rf /var/lib/apt/lists/*

# Copy conanfile.txt and build Conan dependencies
COPY conanfile.txt .
RUN conan profile detect --force
RUN conan install . --output-folder=build --build=missing -s build_type=Release

# Copy source code
COPY . .

# Create build directory and run CMake
RUN cmake -S . -B build -DCMAKE_TOOLCHAIN_FILE=./build/conan_toolchain.cmake -DCMAKE_BUILD_TYPE=Release

# Build the application
RUN cmake --build build --config Release

# Stage 2: Create a minimal runtime image
FROM debian:bookworm-slim AS runtime

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    libpq5 \
    libssl3 \
    # ... other runtime libs if any
    && rm -rf /var/lib/apt/lists/*

# Copy built application and its dependencies from the builder stage
COPY --from=builder /app/build/bin/ECommerceSystem ./ECommerceSystem
COPY --from=builder /app/build/config ./config

# Copy Conan generated shared libraries
COPY --from=builder /root/.conan2/p/ /usr/local/conan-libs/
ENV LD_LIBRARY_PATH="/usr/local/conan-libs/lib:${LD_LIBRARY_PATH}"

# Create logs directory
RUN mkdir -p logs

EXPOSE 8080

CMD ["./ECommerceSystem"]
```