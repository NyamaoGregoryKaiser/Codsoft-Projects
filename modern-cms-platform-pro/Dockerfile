# Base image for building C++ application
FROM drogon/drogon:bionic-v1.8.3-dev AS builder

# Set working directory
WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y \
    cmake \
    libpq-dev \
    # For JWT-CPP, sometimes jsoncpp is needed explicitly, though Drogon may include it
    libjsoncpp-dev \
    # For bcrypt, you might need libbcrypt-dev or similar if linking dynamically.
    # For this example, we assume bcrypt.h is a header-only solution or a mock.
    && rm -rf /var/lib/apt/lists/*

# Copy source code
COPY src/ ./src/
COPY static/ ./static/
COPY CMakeLists.txt . # If CMakeLists.txt is in root, otherwise adjust

# Build Drogon application
RUN mkdir -p build && cd build && \
    cmake .. && \
    make -j$(nproc) && \
    cp cms-cpp /app/

# Runtime image
FROM ubuntu:20.04

WORKDIR /app

# Install runtime dependencies for Drogon and PostgreSQL client
# libpq5 for PostgreSQL client, libjsoncpp1 for jsoncpp
# libevent-2.1-7, libbrotli1, libzstd1, libnghttp2-14, libssl1.1, libsodium23 are Drogon's core runtime deps
RUN apt-get update && apt-get install -y \
    libpq5 \
    libjsoncpp1 \
    libevent-2.1-7 \
    libbrotli1 \
    libzstd1 \
    libnghttp2-14 \
    libssl1.1 \
    libsodium23 \
    # Install uuid-runtime for gen_random_uuid in postgres, often pre-installed
    # Or explicitly for local dev: uuid-runtime
    && rm -rf /var/lib/apt/lists/*

# Copy built application and config file from builder stage
COPY --from=builder /app/cms-cpp /app/cms-cpp
COPY --from=builder /app/src/config.json /app/config.json
COPY --from=builder /app/static /app/static

# Expose the port Drogon listens on
EXPOSE 8080

# Run the application
CMD ["./cms-cpp"]