```cmake
# Minimum required CMake version
cmake_minimum_required(VERSION 3.10)

# Project definition
project(ProjectManagementAPI CXX)

# Set C++ standard to C++17
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# Compiler flags for better warnings and debugging
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -Wall -Wextra -pedantic -Werror")

# --- Find and include dependencies ---

# nlohmann/json (JSON library)
find_package(nlohmann_json CONFIG REQUIRED)

# jwt-cpp (JWT library)
find_package(jwt-cpp CONFIG REQUIRED)

# spdlog (Logging library)
find_package(spdlog CONFIG REQUIRED)

# Pistache (Web framework)
# We might need a custom FindPistache.cmake if not installed globally or via package manager
# For simplicity, assume it's installed or provided via conan/vcpkg.
# If not, you might need to manually add include/library paths.
# A basic FindPistache.cmake is provided in the `cmake` directory.
list(APPEND CMAKE_MODULE_PATH "${CMAKE_SOURCE_DIR}/cmake")
find_package(Pistache REQUIRED)

# SOCI (Database access library) - with SQLite3 backend
# For production, you'd use PostgreSQL, which would require `soci_postgresql`
find_package(SOCI REQUIRED COMPONENTS core sqlite3)

# Google Test (Testing framework)
find_package(GTest CONFIG REQUIRED)

# --- Define directories ---
include_directories(
    src/
    src/core/database
    src/core/models
    src/core/utils
    src/app/services
    src/app/controllers
    src/app/middleware
)

# --- Source Files ---
# Core
set(CORE_SOURCES
    src/core/database/DatabaseManager.cpp
    src/core/models/User.cpp
    src/core/models/Project.cpp
    src/core/models/Task.cpp
    src/core/utils/Config.cpp
    src/core/utils/JWTManager.cpp
    src/core/utils/Logger.cpp
)

# Services
set(SERVICE_SOURCES
    src/app/services/AuthService.cpp
    src/app/services/ProjectService.cpp
    src/app/services/TaskService.cpp
)

# Middleware
set(MIDDLEWARE_SOURCES
    src/app/middleware/AuthMiddleware.cpp
    src/app/middleware/ErrorHandler.cpp
    src/app/middleware/RateLimiter.cpp
)

# Controllers
set(CONTROLLER_SOURCES
    src/app/controllers/AuthController.cpp
    src/app/controllers/ProjectController.cpp
    src/app/controllers/TaskController.cpp
)

# Application entry point
set(APP_SOURCES
    src/app/App.cpp
    src/main.cpp
)

# --- Executable ---
add_executable(${PROJECT_NAME}
    ${CORE_SOURCES}
    ${SERVICE_SOURCES}
    ${MIDDLEWARE_SOURCES}
    ${CONTROLLER_SOURCES}
    ${APP_SOURCES}
)

# Link libraries
target_link_libraries(${PROJECT_NAME}
    PRIVATE
    nlohmann_json::nlohmann_json
    jwt-cpp::jwt-cpp
    spdlog::spdlog
    Pistache::Pistache
    SOCI::core
    SOCI::sqlite3
)

# --- Tests ---
set(TEST_SOURCES
    tests/unit/TestUser.cpp
    tests/unit/TestProjectService.cpp
    tests/unit/TestJWTManager.cpp
    tests/integration/TestDatabase.cpp
    tests/integration/TestAPI.cpp
)

add_executable(run_tests ${TEST_SOURCES})
target_link_libraries(run_tests
    PRIVATE
    gtest_main
    gtest
    ${PROJECT_NAME} # Link the main executable to access its components for testing
)

# Add test discovery for CTest
include(GoogleTest)
gtest_discover_tests(run_tests)

# --- Install rules ---
install(TARGETS ${PROJECT_NAME} DESTINATION bin)
install(DIRECTORY config DESTINATION share/${PROJECT_NAME})
install(DIRECTORY database DESTINATION share/${PROJECT_NAME})
```