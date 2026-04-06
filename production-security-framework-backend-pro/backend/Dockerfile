FROM conanio/gcc12-armv8:latest AS builder

LABEL author="Your Name"
LABEL description="C++ Backend for Secure C++ App"

WORKDIR /app

# Copy conanfile.txt and CMakeLists.txt first to leverage Docker cache
COPY backend/conanfile.txt .
COPY backend/CMakeLists.txt .

# Install Conan dependencies
RUN conan install . --output-folder=build --build=missing -settings compiler.cppstd=20 -pr:h default

# Copy all source code
COPY backend/src src/
COPY backend/tests tests/

# Build the application
RUN cmake -S . -B build -DCMAKE_BUILD_TYPE=Release
RUN cmake --build build --config Release

# --- Runtime stage ---
FROM alpine:latest

WORKDIR /app

# Install runtime dependencies for libpq and libsodium
# Check the specific alpine package names for libpqxx, libsodium
# For pqxx, typically libpq and its dev headers, for libsodium, just libsodium
RUN apk add --no-cache libpq libsodium

# Copy the compiled executable and shared libraries
COPY --from=builder /app/build/SecureCppApp .
# If building for testing, copy the test executable as well:
COPY --from=builder /app/build/SecureCppAppTests .
COPY --from=builder /usr/local/lib /usr/local/lib # Conan installed libs

# Copy .env.example for container environment setup
COPY backend/.env.example ./.env.example

# Create logs directory
RUN mkdir -p logs

EXPOSE 8080

CMD ["./SecureCppApp"]