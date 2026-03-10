```dockerfile
# Stage 1: Build the C++ application
FROM gcc:12.2.0 as builder

WORKDIR /app

# Install dependencies for building
RUN apt-get update && apt-get install -y \
    cmake \
    libsqlite3-dev \
    libssl-dev \
    git \
    build-essential \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Copy external C++ dependencies (Crow, nlohmann/json, sqlite_orm, jwt-cpp, googletest)
# It's assumed these are either git submodules or copied into third_party
COPY src/third_party src/third_party/

# Copy C++ source code
COPY src src/

# Copy CMakeLists.txt
COPY CMakeLists.txt .

# Copy config file
COPY config config/

# Create build directory and compile
RUN cmake -B build -S .
RUN cmake --build build

# Stage 2: Create a smaller runtime image
FROM debian:bookworm-slim

WORKDIR /app

# Install runtime dependencies
# libsqlite3-0: For SQLite database
# libstdc++6: C++ standard library
# libssl3: OpenSSL runtime for JWT (jwt-cpp dependency)
RUN apt-get update && apt-get install -y \
    libsqlite3-0 \
    libstdc++6 \
    libssl3 \
    && rm -rf /var/lib/apt/lists/*

# Copy the compiled application from the builder stage
COPY --from=builder /app/build/mlops-core-service .

# Copy the configuration file (important for runtime)
COPY config config/

# Create data and logs directories
RUN mkdir -p data logs models

# Expose the port the server runs on
EXPOSE 18080

# Run the application
# Specify the config file explicitly
CMD ["./mlops-core-service", "config/default.json"]
```