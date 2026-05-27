# Use a C++ development image with Conan or Vcpkg pre-installed for easier dependency management.
# Here, we'll use a base image with necessary build tools and manually install vcpkg for demonstration.
# In a real project, you might pre-build a custom image with vcpkg already set up and dependencies cached.

# --- Stage 1: Build the backend application ---
FROM debian:bookworm-slim AS build

# Install build dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    git \
    libpq-dev \
    libssl-dev \
    curl \
    unzip \
    pkg-config \
    libfmt-dev \
    && rm -rf /var/lib/apt/lists/*

# Install vcpkg
RUN git clone https://github.com/microsoft/vcpkg.git /opt/vcpkg
WORKDIR /opt/vcpkg
RUN ./bootstrap-vcpkg.sh -disableMetrics
# Integrate vcpkg with CMake (optional, but good for local dev consistency)
# RUN ./vcpkg integrate install

# Set VCPKG_ROOT for CMake to find vcpkg
ENV VCPKG_ROOT /opt/vcpkg

WORKDIR /app

# Copy vcpkg.json and install dependencies
COPY backend-cpp/vcpkg.json .
RUN /opt/vcpkg/vcpkg install --triplet x64-linux

# Copy source code
COPY backend-cpp/src src/
COPY backend-cpp/CMakeLists.txt .
COPY backend-cpp/tests tests/
COPY backend-cpp/.env.example .

# Configure and build the application
# Use the vcpkg toolchain file for CMake
RUN cmake -B build -S . \
    -DCMAKE_TOOLCHAIN_FILE=/opt/vcpkg/scripts/buildsystems/vcpkg.cmake \
    -DCMAKE_BUILD_TYPE=Release \
    -DBUILD_TESTING=OFF # Do not build tests in production image

RUN cmake --build build --config Release

# --- Stage 2: Create the final runtime image ---
FROM debian:bookworm-slim AS runtime

# Install runtime dependencies
# libpq5 for PostgreSQL client, libssl3 for OpenSSL, libspdlog for spdlog, libfmt8 for fmt
RUN apt-get update && apt-get install -y \
    libpq5 \
    libssl3 \
    libspdlog-dev \
    libfmt-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy the built executable and its dependencies from the build stage
COPY --from=build /app/build/bin/ml_backend .
COPY --from=build /app/.env.example .
# Copy any required shared libraries that vcpkg might have placed locally, if not covered by apt-get
# This step might be necessary if some vcpkg dependencies are not system libraries.
# For example, if crow, jwt-cpp etc. are dynamically linked and not available on the runtime image.
# For simplicity, we assume system libraries cover most basic dependencies if built carefully.
# In a real scenario, you'd inspect `ldd ml_backend` from the build stage to see what's needed.

# Create logs directory
RUN mkdir -p logs

# Expose the port the application runs on
EXPOSE 8080

# Set environment variables from .env.example (or better, mount .env file during runtime)
# The .env file will be mounted by docker-compose, this is just for reference/default
ENV APP_HOST=0.0.0.0
ENV APP_PORT=8080
ENV LOG_LEVEL=info
ENV LOG_FILE_PATH=./logs/ml_backend.log

# Command to run the application
CMD ["./ml_backend"]
```