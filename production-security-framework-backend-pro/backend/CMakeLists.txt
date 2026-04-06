cmake_minimum_required(VERSION 3.16 FATAL_ERROR)
project(SecureCppApp VERSION 1.0.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# Ensure CMAKE_BUILD_TYPE is set for Conan (e.g., Release, Debug)
if(NOT CMAKE_BUILD_TYPE AND NOT CMAKE_CONFIGURATION_TYPES)
    message(STATUS "Setting build type to 'Release' as none was specified.")
    set(CMAKE_BUILD_TYPE Release CACHE STRING "Choose the type of build." FORCE)
    set_property(CACHE CMAKE_BUILD_TYPE PROPERTY STRINGS "Debug" "Release" "MinSizeRel" "RelWithDebInfo")
endif()

# Conan integration
if(NOT EXISTS "${CMAKE_BINARY_DIR}/conan_deps.cmake")
    message(STATUS "Conan dependencies not found. Please run 'conan install . --output-folder=${CMAKE_BINARY_DIR}'")
endif()

include(${CMAKE_BINARY_DIR}/conan_deps.cmake)
include(${CMAKE_BINARY_DIR}/conan_toolchain.cmake)

# Libraries
find_package(Crow REQUIRED)
find_package(nlohmann_json REQUIRED)
find_package(libsodium REQUIRED)
find_package(spdlog REQUIRED)
find_package(jwt-cpp REQUIRED)
find_package(pqxx REQUIRED)

# Source files
set(APP_SRCS
    src/main.cpp
    src/app.h
    src/controllers/auth_controller.h
    src/controllers/user_controller.h
    src/controllers/product_controller.h
    src/services/auth_service.h
    src/services/user_service.h
    src/services/product_service.h
    src/repositories/user_repository.h
    src/repositories/product_repository.h
    src/models/user.h
    src/models/product.h
    src/utils/app_config.h
    src/utils/argon2_hasher.h
    src/utils/jwt_manager.h
    src/utils/logger.h
    src/utils/custom_exceptions.h
    src/utils/cache.h
    src/utils/rate_limiter.h
    src/middleware/auth_middleware.h
    src/middleware/rbac_middleware.h
    src/middleware/error_middleware.h
    src/middleware/rate_limit_middleware.h
    src/database/db_connection.h
)

add_executable(${PROJECT_NAME} ${APP_SRCS})

target_include_directories(${PROJECT_NAME} PRIVATE
    ${CMAKE_CURRENT_SOURCE_DIR}/src
)

target_link_libraries(${PROJECT_NAME} PRIVATE
    Crow::Crow
    nlohmann_json::nlohmann_json
    libsodium::libsodium
    spdlog::spdlog
    jwt-cpp::jwt-cpp
    pqxx::pqxx
)

# --- Test Executable ---
enable_testing()
find_package(Catch2 CONFIG REQUIRED) # Assuming Catch2 is installed via Conan or system

add_executable(SecureCppAppTests tests/main.cpp)
target_sources(SecureCppAppTests PRIVATE
    tests/unit/test_argon2_hasher.cpp
    tests/unit/test_jwt_manager.cpp
    tests/unit/test_cache.cpp
    tests/integration/test_auth_service.cpp
    tests/integration/test_user_repository.cpp
)

target_include_directories(SecureCppAppTests PRIVATE
    ${CMAKE_CURRENT_SOURCE_DIR}/src
)

target_link_libraries(SecureCppAppTests PRIVATE
    Catch2::Catch2
    libsodium::libsodium
    jwt-cpp::jwt-cpp
    spdlog::spdlog # For Logger setup in tests
    pqxx::pqxx     # For DB tests
    # Link other necessary libraries that test components depend on
    Crow::Crow
    nlohmann_json::nlohmann_json
)

add_test(NAME UnitAndIntegrationTests COMMAND SecureCppAppTests)

# Install rules (optional but good practice)
install(TARGETS ${PROJECT_NAME} DESTINATION bin)
install(FILES ${CMAKE_CURRENT_SOURCE_DIR}/.env.example DESTINATION etc) # Example config