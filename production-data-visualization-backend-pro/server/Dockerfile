# Use a C++ development image
FROM gcc:10.2

WORKDIR /app

# Install dependencies (Crow, libpqxx, nlohmann-json, spdlog, openssl-dev, cmake)
# This assumes Debian/Ubuntu base image for gcc
RUN apt-get update && apt-get install -y \
    libcrow-dev \
    libpqxx-dev \
    libjsoncpp-dev \
    libspdlog-dev \
    libssl-dev \
    cmake \
    uuid-dev \
    libboost-uuid-dev \
    build-essential \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy C++ source code
COPY server/CMakeLists.txt ./
COPY server/src/ ./src/
COPY server/tests/ ./tests/

# Create logs and data_storage directories
RUN mkdir -p logs && mkdir -p data_storage

# Build the C++ application
RUN cmake -B build && \
    cmake --build build -j$(nproc)

# Expose the port the server listens on
EXPOSE 8080

# Define environment variables (can be overridden at runtime)
ENV SERVER_PORT 8080
ENV DATABASE_URL "postgresql://user:password@localhost:5432/datavizpro"
ENV JWT_SECRET "your_very_secure_and_long_random_jwt_secret_key_change_me_now"

# Run the application
CMD ["./build/dataviz_server"]
```