cmake_minimum_required(VERSION 3.15)
project(AuthSystem CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_POSITION_INDEPENDENT_CODE ON)

# Configure Vcpkg integration
if (NOT DEFINED VCPKG_ROOT)
    # Attempt to find vcpkg automatically if VCPKG_ROOT is not set
    find_program(VCPKG_EXECUTABLE vcpkg)
    if (VCPKG_EXECUTABLE)
        get_filename_component(VCPKG_ROOT_DIR "${VCPKG_EXECUTABLE}" DIRECTORY)
        if (EXISTS "${VCPKG_ROOT_DIR}/../scripts/buildsystems/vcpkg.cmake")
            set(VCPKG_ROOT "${VCPKG_ROOT_DIR}/..")
        endif()
    endif()
endif()

if (EXISTS "${VCPKG_ROOT}/scripts/buildsystems/vcpkg.cmake")
    message(STATUS "VCPKG_ROOT: ${VCPKG_ROOT}")
    include("${VCPKG_ROOT}/scripts/buildsystems/vcpkg.cmake")
    set(VCPKG_POLICY_EMPTY_PACKAGE enabled) # Recommended for modern CMake + vcpkg
else()
    message(WARNING "vcpkg not found. Please set VCPKG_ROOT or ensure vcpkg is in PATH.")
    message(WARNING "Attempting to build without vcpkg for core dependencies.")
endif()

# Find and link required libraries
find_package(Pistache REQUIRED)
find_package(Pqxx REQUIRED)
find_package(JWT_CPP REQUIRED)
find_package(cpp-bcrypt REQUIRED)
find_package(spdlog REQUIRED)
find_package(nlohmann_json REQUIRED)

# Source files
set(AUTH_SYSTEM_SOURCES
    src/main.cpp
    src/config/Config.cpp
    src/database/DBManager.cpp
    src/handlers/AuthHandler.cpp
    src/handlers/UserHandler.cpp
    src/logger/Logger.cpp
    src/middleware/AuthMiddleware.cpp
    src/middleware/ErrorMiddleware.cpp
    src/middleware/RateLimitMiddleware.cpp
    src/models/User.cpp
    src/utils/JWTManager.cpp
    src/utils/PasswordHasher.cpp
)

add_executable(auth_server ${AUTH_SYSTEM_SOURCES})

target_include_directories(auth_server PRIVATE
    ${CMAKE_CURRENT_SOURCE_DIR}/src
)

target_link_libraries(auth_server PRIVATE
    Pistache::Pistache
    Pqxx::Pqxx
    jwt-cpp
    cpp-bcrypt
    spdlog::spdlog
    nlohmann_json::nlohmann_json
)

# --- Unit and Integration Tests ---
enable_testing()
find_package(GTest CONFIG REQUIRED)

# Unit Test Sources
set(UNIT_TEST_SOURCES
    tests/unit/AuthTests.cpp
    tests/unit/DBTests.cpp
    src/config/Config.cpp # Need to link source files for testing
    src/database/DBManager.cpp
    src/handlers/AuthHandler.cpp
    src/logger/Logger.cpp
    src/middleware/AuthMiddleware.cpp
    src/middleware/RateLimitMiddleware.cpp
    src/models/User.cpp
    src/utils/JWTManager.cpp
    src/utils/PasswordHasher.cpp
)

add_executable(unit_tests ${UNIT_TEST_SOURCES})
target_include_directories(unit_tests PRIVATE
    ${CMAKE_CURRENT_SOURCE_DIR}/src
)
target_link_libraries(unit_tests PRIVATE
    GTest::gtest_main
    GTest::gtest
    Pqxx::Pqxx
    jwt-cpp
    cpp-bcrypt
    spdlog::spdlog
    nlohmann_json::nlohmann_json
)
add_test(NAME unit_tests COMMAND unit_tests)

# Integration Test Sources (simplified, might require a running server)
set(INTEGRATION_TEST_SOURCES
    tests/integration/APITests.cpp
    src/config/Config.cpp # Link necessary source files for HTTP client
    src/logger/Logger.cpp
)

add_executable(integration_tests ${INTEGRATION_TEST_SOURCES})
target_include_directories(integration_tests PRIVATE
    ${CMAKE_CURRENT_SOURCE_DIR}/src
)
target_link_libraries(integration_tests PRIVATE
    GTest::gtest_main
    GTest::gtest
    Pistache::Pistache # For HTTP client utilities if used in tests, otherwise just headers.
    nlohmann_json::nlohmann_json
    spdlog::spdlog
)
add_test(NAME integration_tests COMMAND integration_tests) # This test needs a running server.
```

### `backend/src/logger/Logger.h`
```cpp