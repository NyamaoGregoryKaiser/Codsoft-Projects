```cmake
cmake_minimum_required(VERSION 3.10 FATAL_ERROR)
project(ProductCatalogService VERSION 1.0.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_POSITION_INDEPENDENT_CODE ON) # Required for shared libraries

# Ensure compiler flags for warnings
if(CMAKE_CXX_COMPILER_ID MATCHES "GNU|Clang")
    add_compile_options(
        -Wall -Wextra -Wpedantic
        -Werror # Treat warnings as errors in CI/CD
    )
endif()

# Find Drogon
find_package(Drogon REQUIRED)

# Find PostgreSQL
find_package(PostgreSQL REQUIRED)
include_directories(${PostgreSQL_INCLUDE_DIRS})
link_libraries(${PostgreSQL_LIBRARIES})

# Find Poco (for JSON and logging)
find_package(Poco REQUIRED COMPONENTS Foundation Util JSON)
include_directories(${POCO_INCLUDE_DIR})

# Add Google Test for testing
enable_testing()
find_package(GTest CONFIG REQUIRED)
include_directories(${GTEST_INCLUDE_DIRS})

# Define common source directories
set(SRC_DIR src)
set(CONFIG_DIR ${SRC_DIR}/config)
set(CONTROLLERS_DIR ${SRC_DIR}/controllers)
set(DATABASE_DIR ${SRC_DIR}/database)
set(MIDDLEWARE_DIR ${SRC_DIR}/middleware)
set(MODELS_DIR ${SRC_DIR}/models)
set(SERVICES_DIR ${SRC_DIR}/services)
set(UTILS_DIR ${SRC_DIR}/utils)

# Collect all sources for the main application
file(GLOB_RECURSE APP_SOURCES
    "${SRC_DIR}/*.cpp"
    "${CONFIG_DIR}/*.cpp"
    "${CONTROLLERS_DIR}/*.cpp"
    "${DATABASE_DIR}/*.cpp"
    "${MIDDLEWARE_DIR}/*.cpp"
    "${MODELS_DIR}/*.cpp"
    "${SERVICES_DIR}/*.cpp"
    "${UTILS_DIR}/*.cpp"
)

# Add the executable
add_executable(${PROJECT_NAME} ${APP_SOURCES})

# Link libraries
target_link_libraries(${PROJECT_NAME}
    PRIVATE
    drogon
    ${PostgreSQL_LIBRARIES}
    Poco::Foundation
    Poco::Util
    Poco::JSON
)

# Set runtime path for shared libraries if not found in standard paths
# This can be useful for development setups or if dependencies are in a custom location
set_target_properties(${PROJECT_NAME} PROPERTIES
    INSTALL_RPATH "$ORIGIN/../lib" # For local deployment
    BUILD_RPATH "$ORIGIN/../lib"   # For local build testing
)


# --- Testing Configuration ---
set(TEST_SRC_DIR tests)
set(UNIT_TEST_DIR ${TEST_SRC_DIR}/unit)
set(INTEGRATION_TEST_DIR ${TEST_SRC_DIR}/integration)

# Collect unit test sources
file(GLOB UNIT_TEST_SOURCES "${UNIT_TEST_DIR}/*.cpp")

# Add unit test executable
add_executable(UnitTests ${UNIT_TEST_SOURCES})
target_link_libraries(UnitTests
    PRIVATE
    ${PROJECT_NAME} # Link against app for service/model access
    GTest::gtest_main
    GTest::gtest
    drogon # May need drogon for some mocked dependencies
    Poco::Foundation Poco::Util Poco::JSON
)
# Make UnitTests depend on the main project build, so its code is compiled first
add_dependencies(UnitTests ${PROJECT_NAME})
add_test(NAME UnitTests COMMAND UnitTests)

# Collect integration test sources
file(GLOB INTEGRATION_TEST_SOURCES "${INTEGRATION_TEST_DIR}/*.cpp")

# Add integration test executable
add_executable(IntegrationTests ${INTEGRATION_TEST_SOURCES})
target_link_libraries(IntegrationTests
    PRIVATE
    ${PROJECT_NAME} # Link against app for service/model access
    GTest::gtest_main
    GTest::gtest
    drogon
    ${PostgreSQL_LIBRARIES}
    Poco::Foundation Poco::Util Poco::JSON
)
add_dependencies(IntegrationTests ${PROJECT_NAME})
add_test(NAME IntegrationTests COMMAND IntegrationTests)


# Install rules (for production deployment)
install(TARGETS ${PROJECT_NAME} DESTINATION bin)
install(FILES config/app_config.json DESTINATION etc) # Install config file
```