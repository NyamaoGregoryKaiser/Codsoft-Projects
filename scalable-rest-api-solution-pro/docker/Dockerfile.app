```dockerfile
# Dockerfile for C++ API Application
FROM debian:bookworm-slim AS builder

# Install build dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    libssl-dev \
    libspdlog-dev \
    libnlohmann-json-dev \
    libpistache-dev \
    libsoci-dev \
    libsoci-sqlite3-dev \
    libjwt-dev \
    git \
    pkg-config \
    doxygen \
    && rm -rf /var/lib/apt/lists/*

# Clone jwt-cpp as it might not be available via apt-get in all distros, or might be outdated
# This assumes it's not provided by libjwt-dev (which usually refers to libjwt, not jwt-cpp)
# If libjwt-dev provides it, this step might be redundant. For robustness, build from source.
WORKDIR /usr/local/src/jwt-cpp
RUN git clone https://github.com/Thalhammer/jwt-cpp.git . && \
    mkdir build && cd build && \
    cmake .. -DBUILD_SHARED_LIBS=ON -DCMAKE_INSTALL_PREFIX=/usr/local && \
    make -j$(nproc) && make install

# Clone nlohmann/json if not available or outdated. (Usually installed via `libnlohmann-json-dev`)
# WORKDIR /usr/local/src/nlohmann_json
# RUN git clone https://github.com/nlohmann/json.git . && \
#     mkdir build && cd build && \
#     cmake .. -DBUILD_SHARED_LIBS=ON -DCMAKE_INSTALL_PREFIX=/usr/local && \
#     make -j$(nproc) && make install

# Copy source code
WORKDIR /app
COPY . .

# Build the application
RUN mkdir build && cd build && \
    cmake .. && \
    make -j$(nproc)

# --- Runtime stage ---
FROM debian:bookworm-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    libssl3 \
    libspdlog1.10 \
    libnlohmann-json3.11 \
    libpistache0.0 \
    libsoci0.0 \
    libsoci-sqlite30.0 \
    libsqlite3-0 \
    libjwt0 \
    && rm -rf /var/lib/apt/lists/*

# Copy the built executable from the builder stage
COPY --from=builder /app/build/ProjectManagementAPI /usr/local/bin/project-management-api
COPY --from=builder /app/config /app/config
COPY --from=builder /app/database /app/database
COPY --from=builder /usr/local/lib/libjwt-cpp.so* /usr/local/lib/ # Copy jwt-cpp shared lib
# If other custom-built libraries exist, copy them similarly.

# Ensure lib paths are updated
RUN ldconfig

# Set working directory
WORKDIR /app

# Expose the API port
EXPOSE 9080

# Environment variables for configuration
# These can be overridden in docker-compose.yml
ENV DB_PATH=database/project_management.db
ENV SERVER_HOST=0.0.0.0
ENV SERVER_PORT=9080
ENV JWT_SECRET=supersecretjwtkey_changeme_in_production!
ENV JWT_ISSUER=project-management-api
ENV JWT_EXPIRY_MINUTES=60
ENV RATE_LIMIT_MAX_REQUESTS=100
ENV RATE_LIMIT_TIME_WINDOW_SECONDS=60
ENV LOG_CONFIG_PATH=config/log_config.json

# Command to run the application
CMD ["/usr/local/bin/project-management-api"]
```