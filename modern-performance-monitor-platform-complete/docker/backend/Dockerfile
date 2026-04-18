```dockerfile
# Stage 1: Build C++ application
FROM gcc:11.2-buster AS builder

# Install build dependencies
RUN apt-get update && apt-get install -y \
    cmake \
    libpq-dev \
    libpqxx-dev \
    libboost-uuid-dev \
    libcrypt-dev \
    pkg-config \
    git \
    build-essential \
    # Clean up APT cache to reduce image size
    && rm -rf /var/lib/apt/lists/*

# Install Crow (header-only, simple copy)
RUN git clone https://github.com/ipkn/crow.git /usr/local/include/crow
# Install nlohmann/json (header-only, simple copy)
RUN git clone https://github.com/nlohmann/json.git /usr/local/include/nlohmann/json
# Install spdlog (header-only, simple copy)
RUN git clone https://github.com/gabime/spdlog.git /usr/local/include/spdlog
# Install jwt-cpp
RUN git clone https://github.com/Thalhammer/jwt-cpp.git /usr/local/include/jwt-cpp

# Copy source code
WORKDIR /app
COPY backend/CMakeLists.txt .
COPY backend/src src/

# Build
RUN cmake .
RUN make -j$(nproc)

# Stage 2: Create a smaller runtime image
FROM debian:buster-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    libpq5 \
    libstdc++6 \
    # Clean up APT cache to reduce image size
    && rm -rf /var/lib/apt/lists/*

# Copy the built executable from the builder stage
COPY --from=builder /app/PerfoMetricsBackend /usr/local/bin/perfo-metrics-backend

# Create a directory for logs
RUN mkdir -p /app/logs

# Set the working directory
WORKDIR /app

# Expose the port the application listens on
EXPOSE 8080

# Command to run the application
CMD ["/usr/local/bin/perfo-metrics-backend"]
```