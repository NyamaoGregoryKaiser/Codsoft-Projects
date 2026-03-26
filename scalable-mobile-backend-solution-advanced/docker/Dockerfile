```dockerfile
# Stage 1: Build C++ application
FROM ubuntu:22.04 AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    build-essential \
    cmake \
    git \
    libjsoncpp-dev \
    libpq-dev \
    libhiredis-dev \
    libssl-dev \
    uuid-dev \
    libbcrypt-dev \
    zlib1g-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Clone Drogon (or install via apt/vcpkg if preferred)
# For simplicity, we'll clone. A production setup might use system packages or vcpkg.
RUN git clone https://github.com/drogonframework/drogon.git
RUN cd drogon && git checkout v1.9.0 && git submodule update --init --recursive
RUN cd drogon && mkdir build && cd build && cmake .. && make -j$(nproc) && make install

# Clone spdlog (or install via apt/vcpkg)
RUN git clone https://github.com/gabime/spdlog.git
RUN cd spdlog && git checkout v1.11.0 && mkdir build && cd build && cmake .. && make -j$(nproc) && make install

# Clone jwt-cpp (header-only, or build if needed)
# For jwt-cpp, we will clone it and simply include its headers in our CMAKE.
# If it had a build step, it would go here.
# For simplicity, assume it's header-only from the repo root
# RUN git clone https://github.com/Thalhammer/jwt-cpp.git /usr/local/include/jwt-cpp # For simple header inclusion

# Copy application source code
COPY . /app/src_app

# Set up CMake build for the application
WORKDIR /app/src_app
RUN mkdir build

WORKDIR /app/src_app/build
# Use /usr/local/include for Drogon, spdlog.
# Ensure CMake can find jwt-cpp and bcrypt.
# For jwt-cpp, if it's just headers, include path is sufficient.
# For bcrypt-cpp, we linked libbcrypt-dev already.
RUN cmake .. \
    -DCMAKE_BUILD_TYPE=Release \
    -DCMAKE_INSTALL_PREFIX=/usr/local \
    -DDrogon_DIR=/usr/local/lib/cmake/Drogon \
    -Dspdlog_DIR=/usr/local/lib/cmake/spdlog

# Build the application
RUN cmake --build . --target MobileBackend -j$(nproc)

# Stage 2: Create a minimal runtime image
FROM ubuntu:22.04

# Install runtime dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    libpq5 \
    libhiredis0.15 \
    libjsoncpp25 \
    libssl3 \
    libbcrypt-dev \
    uuid-runtime \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy the built application and its configuration
COPY --from=builder /app/src_app/build/MobileBackend /app/MobileBackend
COPY --from=builder /app/src_app/config/drogon_config.json /app/config/drogon_config.json
COPY --from=builder /app/src_app/.env.example /app/.env

# Create log directory
RUN mkdir -p /app/logs

# Expose the port the application listens on
EXPOSE 8080

# Run the application
CMD ["/app/MobileBackend"]
```