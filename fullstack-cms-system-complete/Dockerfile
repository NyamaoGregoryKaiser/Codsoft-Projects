```dockerfile
# Stage 1: Build the application
FROM debian:bullseye-slim AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && \
    apt-get install -y \
    build-essential \
    cmake \
    git \
    libjsoncpp-dev \
    libpq-dev \
    libssl-dev \
    libyaml-cpp-dev \
    zlib1g-dev \
    libgoogle-test-dev \
    pkg-config && \
    rm -rf /var/lib/apt/lists/*

# Clone Drogon and build (or add Drogon as a submodule if preferred)
# For simplicity, we assume Drogon is already cloned or handled by CMake FetchContent
# If Drogon is installed via apt/package manager, these steps might change.
# Or you can integrate Drogon as a submodule and build it with your project.
# For this example, let's assume it's installed or provided.
# A robust setup would use CMake's FetchContent for Drogon.

# Copy source code and build files
COPY CMakeLists.txt ./
COPY src/ ./src/
COPY config/ ./config/
COPY tests/ ./tests/
COPY database/ ./database/

# Build Drogon (if not system-installed, assuming a submodule setup)
# If using Drogon as a submodule:
# RUN git submodule update --init --recursive
# RUN cd drogon && mkdir build && cd build && cmake .. && make -j$(nproc) && make install

# Build the application
RUN cmake -B build
RUN cmake --build build -j$(nproc)

# Stage 2: Create a smaller runtime image
FROM debian:bullseye-slim

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && \
    apt-get install -y \
    libjsoncpp25 \
    libpq5 \
    libssl1.1 \
    libyaml-cpp0.7 \
    zlib1g && \
    rm -rf /var/lib/apt/lists/*

# Copy the built executable, config, and views from the builder stage
COPY --from=builder /app/build/apexcontent ./
COPY --from=builder /app/config ./config
COPY --from=builder /app/src/views ./views

# Create directories for logs and uploads
RUN mkdir -p logs uploads

# Expose the port Drogon listens on
EXPOSE 8080

# Command to run the application
CMD ["./apexcontent"]
```