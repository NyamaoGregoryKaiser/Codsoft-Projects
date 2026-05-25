```cmake
cmake_minimum_required(VERSION 3.10)
project(chat_backend CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_POSITION_INDEPENDENT_CODE ON) # Required for shared libraries and often good practice

# Find Pistache
find_package(Pistache REQUIRED)
if (NOT Pistache_FOUND)
    message(FATAL_ERROR "Pistache not found. Please install it or specify its path.")
endif()

# Find Boost (for Beast, System, Coroutine, etc.)
# Specify components needed explicitly
find_package(Boost 1.70 COMPONENTS system thread program_options filesystem REQUIRED)
if (NOT Boost_FOUND)
    message(FATAL_ERROR "Boost not found. Please install it.")
endif()

# Find PostgreSQL (pqxx)
find_package(PkgConfig REQUIRED)
pkg_check_modules(PQXX REQUIRED libpqxx)
if (NOT PQXX_FOUND)
    message(FATAL_ERROR "libpqxx not found. Please install libpqxx-dev.")
endif()

# Find Redis (hiredis)
pkg_check_modules(HIREDIS REQUIRED hiredis)
if (NOT HIREDIS_FOUND)
    message(FATAL_ERROR "hiredis not found. Please install hiredis-dev.")
endif()

# Find OpenSSL (for JWT)
find_package(OpenSSL REQUIRED)
if (NOT OPENSSL_FOUND)
    message(FATAL_ERROR "OpenSSL not found. Please install libssl-dev.")
endif()

# Add external dependencies as submodules or through FetchContent if needed,
# or assume they are system-installed. For simplicity, we assume system-installed.
# nlohmann/json: header-only
# spdlog: header-only or can be compiled as a library
# jwt-cpp: header-only or can be compiled as a library

# Add nlohmann/json (assuming it's in a common include path or as a submodule)
# Example if using as a git submodule:
# add_subdirectory(external/json) # If json is a submodule, path would vary

# Add spdlog (assuming it's in a common include path or as a submodule)
# Example if using as a git submodule:
# add_subdirectory(external/spdlog)

# Add jwt-cpp (assuming it's in a common include path or as a submodule)
# Example if using as a git submodule:
# add_subdirectory(external/jwt-cpp)

# Define source directories
set(SOURCE_DIR ${CMAKE_CURRENT_SOURCE_DIR}/src)

# Collect all source files
file(GLOB_RECURSE SOURCES
    "${SOURCE_DIR}/*.cpp"
    "${SOURCE_DIR}/*/*.cpp"
)

# Define include directories
include_directories(
    ${SOURCE_DIR}
    ${Pistache_INCLUDE_DIR}
    ${Boost_INCLUDE_DIRS}
    ${PQXX_INCLUDE_DIRS}
    ${HIREDIS_INCLUDE_DIRS}
    ${OPENSSL_INCLUDE_DIR}
    # Add paths for nlohmann/json, spdlog, jwt-cpp if they are not system-wide
    # e.g., ${CMAKE_CURRENT_SOURCE_DIR}/external/json/include
)

add_executable(chat_backend ${SOURCES})

target_link_libraries(chat_backend
    Pistache::Pistache
    ${Boost_LIBRARIES}
    ${PQXX_LIBRARIES}
    ${HIREDIS_LIBRARIES}
    ${OPENSSL_LIBRARIES}
    # Add spdlog and jwt-cpp libraries if they are not header-only or require linking
    # e.g., spdlog_lib jwt-cpp_lib
)

# Add Google Test for unit tests
enable_testing()
add_subdirectory(tests) # Assumes a 'tests' subdirectory with its own CMakeLists.txt
```