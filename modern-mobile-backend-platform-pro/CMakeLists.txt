```cmake
cmake_minimum_required(VERSION 3.10)
project(mobile_backend_app VERSION 1.0.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_POSITION_INDEPENDENT_CODE ON) # Required for shared libraries/PIE executables

# Find Drogon
find_package(Drogon REQUIRED)

# Find spdlog
find_package(spdlog REQUIRED)

# Find Google Test (for testing)
find_package(GTest REQUIRED)

# Find PostgreSQL client library (pqxx is often used, but Drogon's built-in support uses libpq)
# Drogon usually links against libpq itself, so direct find_package might not be strictly needed for basic usage
# However, for advanced pqxx usage, or if Drogon doesn't cover all needs, include it.
# For this example, we'll rely on Drogon's internal DB client.

# Find json library (nlohmann/json for config parsing)
# It's usually a header-only library, so we just need to include its directory.
# We'll use FetchContent for this common header-only library.
include(FetchContent)
FetchContent_Declare(
  nlohmann_json
  GIT_REPOSITORY https://github.com/nlohmann/json.git
  GIT_TAG v3.11.2
)
FetchContent_MakeAvailable(nlohmann_json)

# Source files for the main application
file(GLOB_RECURSE APP_SOURCES
    "src/*.cc"
    "src/controllers/*.cc"
    "src/services/*.cc"
    "src/dao/*.cc"
    "src/utils/*.cc"
    "src/middleware/*.cc"
    "src/exceptions/*.cc"
)

# Header files for the main application (for IDEs and potential precompiled headers)
file(GLOB_RECURSE APP_HEADERS
    "src/*.h"
    "src/controllers/*.h"
    "src/services/*.h"
    "src/dao/*.h"
    "src/utils/*.h"
    "src/middleware/*.h"
    "src/exceptions/*.h"
    "src/models/*.h"
)

add_executable(${PROJECT_NAME} ${APP_SOURCES} ${APP_HEADERS})

# Link libraries
target_link_libraries(${PROJECT_NAME} PRIVATE
    Drogon::drogon
    spdlog::spdlog
)

# Include directories
target_include_directories(${PROJECT_NAME} PRIVATE
    ${CMAKE_SOURCE_DIR}/src
    ${nlohmann_json_SOURCE_DIR}/include # Add nlohmann/json include path
)

# --- Build tests ---
enable_testing()

add_subdirectory(tests)

# --- Configuration for Drogon ---
# Drogon can generate a config file template. For this project, we'll manage config
# via src/utils/AppConfig.cc and JSON files.

# Set output directory for executables (optional but good for clean builds)
set(CMAKE_RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/bin)
```