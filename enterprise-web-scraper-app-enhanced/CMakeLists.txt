```cmake
cmake_minimum_required(VERSION 3.12)
project(ScraperApp CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# Add compiler options for better warnings and debug info
if (CMAKE_CXX_COMPILER_ID MATCHES "GNU|Clang")
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -Wall -Wextra -Wpedantic -Werror -g")
endif()

# --- Find external libraries ---
# libcurl
find_package(CURL REQUIRED)
if (CURL_FOUND)
    message(STATUS "Found CURL: ${CURL_LIBRARIES}")
else()
    message(FATAL_ERROR "CURL library not found!")
endif()

# nlohmann/json (header-only, use FetchContent)
include(FetchContent)
FetchContent_Declare(
    nlolohmann_json
    GIT_REPOSITORY https://github.com/nlohmann/json.git
    GIT_TAG v3.11.2 # Or a more recent stable tag
)
FetchContent_MakeAvailable(nlolohmann_json)

# spdlog (header-only, use FetchContent)
FetchContent_Declare(
    spdlog_lib
    GIT_REPOSITORY https://github.com/gabime/spdlog.git
    GIT_TAG v1.11.0 # Or a more recent stable tag
)
FetchContent_MakeAvailable(spdlog_lib)

# Pistache
FetchContent_Declare(
    Pistache
    GIT_REPOSITORY https://github.com/pistacheio/pistache.git
    GIT_TAG v0.0.5 # Or a more recent stable tag
)
FetchContent_MakeAvailable(Pistache)
# Ensure Pistache dependencies are handled
# Pistache needs OpenSSL, Zlib, CppUnit (for tests)
# For a minimal build, we need OpenSSL development headers (libssl-dev) and zlib1g-dev.
# Find package will try to locate them if not automatically found by FetchContent.
find_package(OpenSSL REQUIRED)
find_package(ZLIB REQUIRED)
# Pistache's CMake might not automatically include curl in its public interface,
# though it can be a dependency for its HTTP client (which we replace with libcurl directly).
# For HTTP server, it usually doesn't need curl.

# pqxx
find_package(PkgConfig)
pkg_check_modules(PQXX REQUIRED libpqxx)
if (PQXX_FOUND)
    message(STATUS "Found pqxx: ${PQXX_LIBRARIES}")
    message(STATUS "pqxx include dirs: ${PQXX_INCLUDE_DIRS}")
else()
    message(FATAL_ERROR "libpqxx not found! Install libpqxx-dev.")
endif()

# jwt-cpp
FetchContent_Declare(
    jwt_cpp
    GIT_REPOSITORY https://github.com/Thalhammer/jwt-cpp.git
    GIT_TAG v0.6.0 # Or a more recent stable tag
)
FetchContent_MakeAvailable(jwt_cpp)
# jwt-cpp depends on OpenSSL for cryptographic operations
find_package(OpenSSL REQUIRED) # Already done, but reiterating for clarity

# bcrypt (using an example simple bcrypt library, actual integration may vary)
# For simplicity, we'll assume a basic bcrypt-compatible header/source is available.
# Or, in a real scenario, you'd integrate a proper C++ bcrypt library.
# For demo, I'll provide a minimalist one if not found.
# Let's mock bcrypt_hashpw and bcrypt_checkpw directly inside AuthManager for simplicity
# and define a dummy BCRYPT_HASHSIZE if bcrypt.h isn't system-wide.
# Or better, link to an actual bcrypt lib. Here using a mock.
# For production, consider using https://github.com/mariusor/bcrypt-cpp or similar.
# For the purpose of meeting the requirements, I'll assume a mock `bcrypt.h` that defines the function signatures.
# In a real project, you'd add:
# find_library(BCRYPT_LIBRARY bcrypt HINTS /usr/local/lib /usr/lib)
# if(BCRYPT_LIBRARY)
#    message(STATUS "Found bcrypt library: ${BCRYPT_LIBRARY}")
#    target_link_libraries(${PROJECT_NAME} PRIVATE ${BCRYPT_LIBRARY})
# else()
#    message(FATAL_ERROR "bcrypt library not found. Please install libbcrypt-dev or similar.")
# endif()
# For the demo, I'll provide a dummy bcrypt.h in the root for compilation.
# Include it globally here or specifically in auth module.
# UUID (libuuid)
find_package(UUID REQUIRED)
if (UUID_FOUND)
    message(STATUS "Found UUID: ${UUID_LIBRARIES}")
else()
    message(FATAL_ERROR "libuuid not found! Install libuuid-dev.")
endif()


# --- Application Source Files ---
# Define source groups for better organization in IDEs
file(GLOB_RECURSE APP_SOURCES "src/*.cpp" "src/*.h")
file(GLOB_RECURSE TEST_SOURCES "tests/*.cpp" "tests/*.h" "tests/*/*.cpp")

# Group app sources
source_group("Config" FILES src/config/ConfigManager.h)
source_group("Utils" FILES src/utils/Logger.h src/utils/ErrorHandler.h)
source_group("Auth" FILES src/auth/AuthManager.h src/auth/JWTUtils.h)
source_group("Database/Models" FILES src/database/models/User.h src/database/models/ScrapingJob.h src/database/models/ScrapedData.h)
source_group("Database" FILES src/database/DatabaseManager.h src/database/ConnectionPool.h)
source_group("Scraping" FILES src/scraping/Scraper.h src/scraping/HttpFetcher.h src/scraping/HtmlParser.h src/scraping/JobScheduler.h)
source_group("API/DTOs" FILES src/api/DTOs.h)
source_group("API/Middleware" FILES src/api/middleware/AuthMiddleware.h)
source_group("API/Controllers" FILES src/api/controllers/AuthController.h src/api/controllers/JobController.h src/api/controllers/DataController.h)
source_group("API" FILES src/api/ApiServer.h)
source_group("" FILES src/app.h src/main.cpp)

# Define the executable
add_executable(scraper_backend src/main.cpp)

# Add all headers as target sources for IDEs and dependency scanning
target_sources(scraper_backend PRIVATE ${APP_SOURCES})

# Include directories
target_include_directories(scraper_backend PRIVATE
    ${CMAKE_CURRENT_SOURCE_DIR}/src
    ${Pistache_SOURCE_DIR}/include
    ${nlohmann_json_SOURCE_DIR}/include
    ${spdlog_lib_SOURCE_DIR}/include
    ${jwt_cpp_SOURCE_DIR}/include
)

# Link libraries
target_link_libraries(scraper_backend PRIVATE
    Pistache::Pistache
    ${CURL_LIBRARIES}
    ${PQXX_LIBRARIES}
    ${OpenSSL_LIBRARIES} # Required by Pistache and jwt-cpp
    ${ZLIB_LIBRARIES}    # Required by Pistache
    ${UUID_LIBRARIES}
)

# --- Unit and Integration Tests ---
enable_testing()
FetchContent_Declare(
    googletest
    GIT_REPOSITORY https://github.com/google/googletest.git
    GIT_TAG release-1.12.1 # Or a recent stable tag
)
FetchContent_MakeAvailable(googletest)

add_subdirectory(tests) # This will handle test executable creation

# Ensure directories for logs and config exist
file(MAKE_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}/logs")
file(MAKE_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}/config")

# Copy default .env file if it doesn't exist (for easier local setup)
# configure_file copies the file, but doesn't check if it exists.
# A custom command or separate script is better for "if not exists".
# For CMake build, it's easier to just copy it and let the user override.
# Alternatively, use `add_custom_command` with `cmake -E copy_if_different`.
add_custom_command(TARGET scraper_backend POST_BUILD
    COMMAND ${CMAKE_COMMAND} -E copy_if_different
    "${CMAKE_CURRENT_SOURCE_DIR}/config/.env.example"
    "${CMAKE_CURRENT_SOURCE_SOURCE_DIR}/config/.env"
    COMMENT "Copying .env.example to .env if not present"
)
```