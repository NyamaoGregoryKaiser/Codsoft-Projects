```dockerfile
# Stage 1: Build the C++ application
FROM gcc:11.2-buster AS builder

# Install build dependencies
RUN apt-get update && apt-get install -y \
    cmake \
    libboost-all-dev \
    libpistache-dev \
    libpqxx-dev \
    libhiredis-dev \
    libssl-dev \
    pkg-config \
    # Cryptopp for password hashing
    libcryptopp-dev \
    # Clean up
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install nlohmann/json, spdlog, jwt-cpp (header-only or simple build)
# For simplicity, assuming these are pulled by CMake or manually placed
# Example for nlohmann/json (header-only):
RUN mkdir -p /usr/local/include/nlohmann && \
    wget -O /usr/local/include/nlohmann/json.hpp https://github.com/nlohmann/json/releases/download/v3.10.5/json.hpp

# Example for spdlog (can be header-only or compiled)
# If using compiled:
# RUN git clone https://github.com/gabime/spdlog.git /usr/local/src/spdlog && \
#     cd /usr/local/src/spdlog && \
#     mkdir build && cd build && \
#     cmake .. && make -j$(nproc) && make install
# If header-only, just copy headers:
RUN mkdir -p /usr/local/include/spdlog && \
    wget -O /tmp/spdlog.zip https://github.com/gabime/spdlog/archive/refs/tags/v1.10.0.zip && \
    unzip /tmp/spdlog.zip -d /tmp/ && \
    cp -r /tmp/spdlog-1.10.0/include/spdlog /usr/local/include/

# Example for jwt-cpp (header-only)
RUN mkdir -p /usr/local/include/jwt-cpp && \
    wget -O /tmp/jwt-cpp.zip https://github.com/Thalhammer/jwt-cpp/archive/refs/tags/v0.6.0.zip && \
    unzip /tmp/jwt-cpp.zip -d /tmp/ && \
    cp -r /tmp/jwt-cpp-0.6.0/include/jwt-cpp /usr/local/include/

WORKDIR /app/backend

COPY . .

RUN cmake -B build -DCMAKE_BUILD_TYPE=Release
RUN cmake --build build --config Release

# Stage 2: Create a smaller runtime image
FROM debian:buster-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    libboost-system1.67.0 \
    libboost-thread1.67.0 \
    libpqxx-6.4 \
    libhiredis0.14 \
    libssl1.1 \
    libcryptopp8 \
    # Clean up
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy the built executable from the builder stage
COPY --from=builder /app/backend/build/chat_backend .
COPY --from=builder /app/backend/build/logs ./logs # Create logs directory

EXPOSE 9001 9002

CMD ["./chat_backend"]
```