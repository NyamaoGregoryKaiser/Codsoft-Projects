cmake_minimum_required(VERSION 3.10)
project(cms_tests)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Find Google Test
find_package(GTest CONFIG REQUIRED)

# Find Drogon (needed for some utilities and DB client setup in integration tests)
find_package(Drogon REQUIRED)

# Link JSONCPP
find_package(Jsoncpp CONFIG REQUIRED)

# Include directories
include_directories(${GTEST_INCLUDE_DIRS})
include_directories(${Drogon_INCLUDE_DIRS})
include_directories(${CMAKE_SOURCE_DIR}/../src)
include_directories(${CMAKE_SOURCE_DIR}/../src/utils)
include_directories(${CMAKE_SOURCE_DIR}/../src/models)
include_directories(${CMAKE_SOURCE_DIR}/../src/services)

# Define a test executable
add_executable(cms_test_runner
    unit/test_password_hasher.cc
    unit/test_jwt_manager.cc
    integration/test_user_service.cc
    # Add other test files here
)

# Link Google Test libraries and other dependencies
target_link_libraries(cms_test_runner
    PRIVATE
        GTest::gtest_main
        GTest::gtest
        Drogon::Drogon # For integration tests
        Jsoncpp::jsoncpp # For JWT and general JSON
        # Link our application utilities (mocked bcrypt is assumed via header)
        ${CMAKE_SOURCE_DIR}/../src/utils/PasswordHasher.cc
        ${CMAKE_SOURCE_DIR}/../src/utils/JwtManager.cc
        ${CMAKE_SOURCE_DIR}/../src/services/UserService.cc
)

# Optional: Add compiler flags for warnings
if(CMAKE_CXX_COMPILER_ID MATCHES "GNU|Clang")
    target_compile_options(cms_test_runner PRIVATE
        -Wall
        -Wextra
        -Wpedantic
    )
endif()