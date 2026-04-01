```dockerfile
# Stage 1: Build the C++ application
FROM gcc:12.2.0 as builder

WORKDIR /app/backend

# Install build dependencies
RUN apt-get update && apt-get install -y \
    cmake \
    libpq-dev \
    libssl-dev \
    git \
    build-essential \
    # Remove this if using vcpkg/conan for pistache
    libpistache-dev \
    && rm -rf /var/lib/apt/lists/*

# Clone/Copy Pistache if not using system libpistache-dev (more robust)
# In this example, we assume `libpistache-dev` installs correctly.
# For jwt-cpp, nlohmann_json, spdlog - assume header-only or installed headers

# Copy source code
COPY . .

# Configure and build
RUN cmake -B build -S .
RUN cmake --build build --config Release

# Stage 2: Create a smaller runtime image
FROM debian:bookworm-slim

WORKDIR /app/backend

# Install runtime dependencies for pqxx and jwt-cpp/openssl
RUN apt-get update && apt-get install -y \
    libpq5 \
    libssl3 \
    && rm -rf /var/lib/apt/lists/*

# Copy the built executable from the builder stage
COPY --from=builder /app/backend/build/CppDBOptimizerBackend /app/backend/CppDBOptimizerBackend
COPY --from=builder /app/backend/.env.example /app/backend/.env # Copy default environment variables

# Create a directory for logs
RUN mkdir -p /app/backend/logs

EXPOSE 9080

CMD ["./CppDBOptimizerBackend"]
```