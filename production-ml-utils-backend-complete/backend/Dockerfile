# Use a C++ build image
FROM gcc:10.2.0

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y \
    cmake \
    libsqlite3-dev \
    git \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy CMakeLists.txt and external dependencies first to leverage Docker cache
COPY CMakeLists.txt .
COPY extern extern

# Build dependencies if they have build steps (e.g., Catch2)
# For header-only libs like Crow, nlohmann/json, spdlog, jwt-cpp, sqlite_modern_cpp (if header-only),
# this step might not be strictly necessary, but it's good practice for modules.
# For example, if Catch2 requires a build:
RUN cd extern/Catch2 && cmake . && make && cd ../..

# Copy source code
COPY src src
COPY data data
COPY tests tests

# Configure and build the application
RUN cmake .
RUN make

# Expose the port the app runs on
EXPOSE 8080

# Command to run the application
CMD ["./ml_utilities_backend_app"]
```