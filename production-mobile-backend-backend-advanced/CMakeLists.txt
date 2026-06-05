```cmake
cmake_minimum_required(VERSION 3.16)
project(MobileBackendCpp LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_POSITION_INDEPENDENT_CODE ON) # Required for shared libraries

# Enable useful warnings
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -Wall -Wextra -Werror -pedantic -Wconversion")

# --- External Dependencies ---
# Pistache (web framework)
# Check for local installation first, then download
find_package(Pistache QUIET)
if (NOT Pistache_FOUND)
    message(STATUS "Pistache not found, attempting to fetch as subdirectory...")
    # FetchContent (requires CMake 3.11+)
    include(FetchContent)
    FetchContent_Declare(
        Pistache
        GIT_REPOSITORY https://github.com/oktal/pistache.git
        GIT_TAG master # Use a specific tag/commit in production!
        GIT_SHALLOW TRUE
    )
    FetchContent_MakeAvailable(Pistache)
    message(STATUS "Pistache fetched.")
else()
    message(STATUS "Pistache found locally.")
endif()

# nlohmann/json (JSON library)
FetchContent_Declare(
    nlohmann_json
    GIT_REPOSITORY https://github.com/nlohmann/json.git
    GIT_TAG v3.11.2 # Use a specific version
    GIT_SHALLOW TRUE
)
FetchContent_MakeAvailable(nlohmann_json)

# SQLiteCpp (SQLite wrapper)
FetchContent_Declare(
    SQLiteCpp
    GIT_REPOSITORY https://github.com/SRombauts/SQLiteCpp.git
    GIT_TAG 3.3.0 # Use a specific version
    GIT_SHALLOW TRUE
)
FetchContent_MakeAvailable(SQLiteCpp)

# spdlog (logging library)
FetchContent_Declare(
    spdlog
    GIT_REPOSITORY https://github.com/gabime/spdlog.git
    GIT_TAG v1.12.0 # Use a specific version
    GIT_SHALLOW TRUE
)
FetchContent_MakeAvailable(spdlog)

# jwt-cpp (JWT library)
FetchContent_Declare(
    jwt_cpp
    GIT_REPOSITORY https://github.com/Thalhammer/jwt-cpp.git
    GIT_TAG v0.6.0 # Use a specific version
    GIT_SHALLOW TRUE
)
FetchContent_MakeAvailable(jwt_cpp)

# OpenSSL (required by jwt-cpp for some algorithms)
find_package(OpenSSL REQUIRED)
include_directories(${OPENSSL_INCLUDE_DIR})
link_libraries(${OPENSSL_LIBRARIES})

# --- Application Source Files ---
# Define source groups for better organization in IDEs
file(GLOB_RECURSE APP_SOURCES "src/*.cpp" "src/*.h")

add_executable(mobile-backend-cpp ${APP_SOURCES})

target_link_libraries(mobile-backend-cpp
    Pistache::Pistache
    nlohmann_json::nlohmann_json
    SQLiteCpp::SQLiteCpp
    spdlog::spdlog
    jwt_cpp::jwt-cpp
    ${OPENSSL_LIBRARIES} # Link OpenSSL explicitly
)

# --- Add Tests ---
add_subdirectory(tests)

# --- Install rules (optional, for system-wide install) ---
install(TARGETS mobile-backend-cpp DESTINATION bin)
install(FILES ${CMAKE_CURRENT_SOURCE_DIR}/database/schema.sql
              ${CMAKE_CURRENT_SOURCE_DIR}/database/seed.sql
              ${CMAKE_CURRENT_SOURCE_DIR}/.env.example
        DESTINATION share/mobile-backend-cpp)
```