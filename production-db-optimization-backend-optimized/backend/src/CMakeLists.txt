```cmake
cmake_minimum_required(VERSION 3.10)
project(CppDBOptimizerBackend)

# C++17 required for Pistache and modern features
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# Compiler flags for better warnings and optimization
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -Wall -Wextra -Werror -pedantic -g") # -g for debug symbols

# Include directories
include_directories(
    ${CMAKE_SOURCE_DIR}
    ${CMAKE_SOURCE_DIR}/server
    ${CMAKE_SOURCE_DIR}/database
    ${CMAKE_SOURCE_DIR}/controllers
    ${CMAKE_SOURCE_DIR}/middleware
    ${CMAKE_SOURCE_DIR}/services
    ${CMAKE_SOURCE_DIR}/utils
    ${CMAKE_SOURCE_DIR}/common
)

# Find and link dependencies
# Pistache (web framework)
find_package(Pistache REQUIRED)

# pqxx (PostgreSQL C++ client library)
find_package(Pqxx REQUIRED)

# nlohmann/json (JSON library) - Assuming it's installed via system package manager or vendored
# For simplicity, we'll assume it's available globally or copied to `backend/src/vendor/nlohmann_json`
# If vendored:
# add_subdirectory(vendor/nlohmann_json)
# target_include_directories(${PROJECT_NAME} PUBLIC vendor/nlohmann_json/include)
# For system install:
# find_package(nlohmann_json CONFIG REQUIRED) # If installed via vcpkg or similar
# target_link_libraries(${PROJECT_NAME} PUBLIC nlohmann_json::nlohmann_json)

# We'll use a direct include approach for nlohmann_json and jwt-cpp for simplicity in this example,
# assuming they are available via system paths or manually copied to the build environment.
# In a real project, use FetchContent, vcpkg, or conan.
# For jwt-cpp, similar direct include approach.
# For spdlog, similar direct include approach.

# List all source files
file(GLOB_RECURSE SOURCES "*.cpp")

# Define the executable
add_executable(${PROJECT_NAME} ${SOURCES})

# Link libraries to the executable
target_link_libraries(${PROJECT_NAME}
    Pistache::Pistache
    Pqxx::Pqxx
    pthread # For multithreading features often used by network libraries
    # Cryptography library for JWT. For jwt-cpp, it typically links to OpenSSL.
    # We assume OpenSSL is available.
    OpenSSL::SSL
    OpenSSL::Crypto
)

# ==============================================================================
# Testing configuration
# ==============================================================================
enable_testing() # Enable CTest

# Find Catch2 (testing framework)
# If using a system-wide install or vcpkg:
# find_package(Catch2 CONFIG REQUIRED)
# If header-only (like in this example): include Catch2 headers directly.
# We will use FetchContent to get Catch2 for the tests within CMake.

include(FetchContent)
FetchContent_Declare(
    Catch2
    GIT_REPOSITORY https://github.com/catchorg/Catch2.git
    GIT_TAG        v3.3.2 # Or a recent version
)
FetchContent_MakeAvailable(Catch2)

add_executable(TestRunner backend/tests/TestMain.cpp)
file(GLOB_RECURSE TEST_SOURCES backend/tests/**/*.cpp)
target_sources(TestRunner PRIVATE ${TEST_SOURCES})
target_link_libraries(TestRunner Catch2::Catch2WithMain ${PROJECT_NAME} # Link with main app for testing internal components
    Pistache::Pistache
    Pqxx::Pqxx
    pthread
    OpenSSL::SSL
    OpenSSL::Crypto
)

# Add tests using Catch2 discovery
catch_discover_tests(TestRunner)

# Optional: Install target
install(TARGETS ${PROJECT_NAME} DESTINATION bin)
```