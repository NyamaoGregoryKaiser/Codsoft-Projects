cmake_minimum_required(VERSION 3.10)
project(ml_utilities_backend CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_POSITION_INDEPENDENT_CODE ON) # Required for shared libraries on some systems, good practice.

# Add Git submodule dependencies
# Ensure submodules are updated: git submodule update --init --recursive
add_subdirectory(extern/crow)
add_subdirectory(extern/sqlite_modern_cpp) # Assuming this is a local submodule
add_subdirectory(extern/jwt-cpp)
add_subdirectory(extern/spdlog)
add_subdirectory(extern/json) # nlohmann/json

# Define project source directories
set(SRC_DIR src)
set(COMMON_DIR ${SRC_DIR}/common)
set(CONFIG_DIR ${SRC_DIR}/config)
set(DATABASE_DIR ${SRC_DIR}/database)
set(MIDDLEWARE_DIR ${SRC_DIR}/middleware)
set(MODELS_DIR ${SRC_DIR}/models)
set(SERVICES_DIR ${SRC_DIR}/services)
set(CONTROLLERS_DIR ${SRC_DIR}/controllers)

# Include directories
include_directories(
    ${SRC_DIR}
    ${COMMON_DIR}
    ${CONFIG_DIR}
    ${DATABASE_DIR}
    ${MIDDLEWARE_DIR}
    ${MODELS_DIR}
    ${SERVICES_DIR}
    ${CONTROLLERS_DIR}
    extern/crow/include
    extern/sqlite_modern_cpp/include
    extern/jwt-cpp/include
    extern/spdlog/include
    extern/json/single_include
)

# Backend application sources
set(BACKEND_SOURCES
    ${SRC_DIR}/main.cpp
    ${SRC_DIR}/routes.h
    ${COMMON_DIR}/JsonUtils.cpp
    ${COMMON_DIR}/ErrorHandling.cpp
    ${CONFIG_DIR}/AppConfig.cpp
    ${DATABASE_DIR}/DatabaseManager.cpp
    ${MIDDLEWARE_DIR}/AuthMiddleware.cpp
    ${MIDDLEWARE_DIR}/LoggingMiddleware.cpp
    ${MIDDLEWARE_DIR}/CacheMiddleware.cpp
    ${MIDDLEWARE_DIR}/RateLimitMiddleware.cpp
    ${MODELS_DIR}/User.cpp
    ${MODELS_DIR}/Model.cpp
    ${MODELS_DIR}/MLTransformConfig.cpp
    ${SERVICES_DIR}/UserService.cpp
    ${SERVICES_DIR}/ModelService.cpp
    ${SERVICES_DIR}/MLTransformService.cpp
    ${CONTROLLERS}/AuthController.cpp
    ${CONTROLLERS}/UserController.cpp
    ${CONTROLLERS}/ModelController.cpp
    ${CONTROLLERS}/MLTransformController.cpp
)

# Backend executable
add_executable(ml_utilities_backend ${BACKEND_SOURCES})

# Link libraries
target_link_libraries(ml_utilities_backend
    sqlite_modern_cpp
    jwt-cpp
    spdlog
    crow_all # Crow library
    # For nlohmann/json, it's header-only, so no explicit link needed if added to include_directories
)

# --- Build Tests ---
enable_testing()
add_subdirectory(extern/Catch2) # Assuming Catch2 is a submodule

set(TEST_SOURCES
    tests/catch_main.cpp
    tests/test_database.cpp
    tests/test_auth.cpp
    tests/test_ml_transform.cpp
    tests/test_user_service.cpp
    # Add other test files here
)

add_executable(ml_utilities_tests ${TEST_SOURCES} ${BACKEND_SOURCES}) # Link tests to application sources to test internal logic
target_link_libraries(ml_utilities_tests
    Catch2::Catch2
    sqlite_modern_cpp
    jwt-cpp
    spdlog
    crow_all
)

# Hide main for tests if necessary, or just ensure tests don't re-define main
# The main_test.cpp typically defines main and includes Catch2's main.
# It's better to avoid linking the application's main.cpp to the test executable.
# For simplicity, I'm linking all backend sources to tests. In a real project,
# you'd design services/controllers to be testable independently of `main.cpp`.
# If `main.cpp` contains global server setup, it's problematic.
# Let's adjust this: `ml_utilities_tests` should only link against the .o files
# of the services/models/etc., not `main.cpp`.

# Re-evaluate test executable linking for better isolation
# Create a static library for the backend logic that tests can link against
# or selectively compile files without main.cpp.
# For this example, linking all sources except main.cpp to a test runner is cleaner.
# Let's remove main.cpp from TEST_SOURCES and include it in BACKEND_SOURCES only.
# The current approach of adding BACKEND_SOURCES directly might cause multiple definition errors
# if backend files define functions that are then redefined in test files that include backend files.
# A better approach: define a static library for core backend logic, then link tests to it.

# Let's refine for a production setup:
add_library(ml_utilities_lib STATIC
    ${COMMON_DIR}/JsonUtils.cpp
    ${COMMON_DIR}/ErrorHandling.cpp
    ${CONFIG_DIR}/AppConfig.cpp
    ${DATABASE_DIR}/DatabaseManager.cpp
    ${MIDDLEWARE_DIR}/AuthMiddleware.cpp
    ${MIDDLEWARE_DIR}/LoggingMiddleware.cpp
    ${MIDDLEWARE_DIR}/CacheMiddleware.cpp
    ${MIDDLEWARE_DIR}/RateLimitMiddleware.cpp
    ${MODELS_DIR}/User.cpp
    ${MODELS_DIR}/Model.cpp
    ${MODELS_DIR}/MLTransformConfig.cpp
    ${SERVICES_DIR}/UserService.cpp
    ${SERVICES_DIR}/ModelService.cpp
    ${SERVICES_DIR}/MLTransformService.cpp
    ${CONTROLLERS}/AuthController.cpp
    ${CONTROLLERS}/UserController.cpp
    ${CONTROLLERS}/ModelController.cpp
    ${CONTROLLERS}/MLTransformController.cpp
)
target_link_libraries(ml_utilities_lib
    sqlite_modern_cpp
    jwt-cpp
    spdlog
    # nlohmann/json is header-only
)
target_include_directories(ml_utilities_lib PUBLIC
    ${SRC_DIR}
    extern/crow/include
    extern/sqlite_modern_cpp/include
    extern/jwt-cpp/include
    extern/spdlog/include
    extern/json/single_include
)

# Now, link the main executable and the test executable against this library
add_executable(ml_utilities_backend_app ${SRC_DIR}/main.cpp ${SRC_DIR}/routes.h)
target_link_libraries(ml_utilities_backend_app ml_utilities_lib crow_all) # Renamed to avoid confusion

add_executable(ml_utilities_tests ${TEST_SOURCES})
target_link_libraries(ml_utilities_tests ml_utilities_lib Catch2::Catch2)

# Add Catch2 tests automatically
file(GLOB_RECURSE TEST_FILES "tests/*.cpp")
foreach(TEST_FILE ${TEST_FILES})
    if(NOT ${TEST_FILE} MATCHES "catch_main.cpp")
        add_test(NAME ${TEST_FILE} COMMAND ml_utilities_tests ${TEST_FILE})
    endif()
endforeach()
```