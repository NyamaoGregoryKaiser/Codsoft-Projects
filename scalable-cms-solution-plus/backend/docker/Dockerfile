# Use a C++ base image with build tools
FROM ubuntu:22.04 AS build_env

# Install dependencies for drogons, hiredis, jwt-cpp, and bcrypt
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    git \
    libjsoncpp-dev \
    libpq-dev \
    libssl-dev \
    uuid-dev \
    libhiredis-dev \
    libbcrypt-dev \
    pkg-config \
    # Cleanup
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy Drogon's third party libraries setup script
# This is usually needed if Drogon isn't installed system-wide or via package manager.
# Assuming drogons is used as a submodule or installed as a dependency.
# In our CMake setup, drogons is fetched via find_package which handles dependencies.

# Copy source code
COPY . .

# Build drogons (if using as submodule) - not needed if using find_package
# RUN git submodule update --init --recursive
# RUN cd drogon && mkdir build && cd build && cmake .. && make -j$(nproc) && make install

# Create build directory
RUN mkdir build

# Configure and build the application
WORKDIR /app/build
RUN cmake ..
RUN make -j$(nproc)

# --- Runtime Image ---
FROM ubuntu:22.04 AS run_env

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    libjsoncpp25 \
    libpq5 \
    libssl3 \
    libhiredis0.14 \
    libbcrypt1 \
    # Cleanup
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy built executable and config files from build_env
COPY --from=build_env /app/build/CMSSystem /app/bin/CMSSystem
COPY --from=build_env /app/build/config /app/bin/config/
COPY --from=build_env /app/config/*.json /app/config/ # Copy config for initial startup
COPY --from=build_env /app/build/drogon_ctl /usr/local/bin/ # For model generation if needed interactively

# Create logs directory
RUN mkdir -p /app/logs

# Expose the port Drogon listens on
EXPOSE 8080

# Command to run the application
CMD ["/app/bin/CMSSystem"]
```