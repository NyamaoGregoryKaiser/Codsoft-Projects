cmake_minimum_required(VERSION 3.15)
project(MLUtilitiesSystemBackend CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON) # For LSP integration

# Enable AddressSanitizer and UndefinedBehaviorSanitizer for debug builds
if(CMAKE_BUILD_TYPE MATCHES "Debug")
    message(STATUS "Enabling AddressSanitizer and UndefinedBehaviorSanitizer for Debug build.")
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -fsanitize=address,undefined -fno-omit-frame-pointer -fno-sanitize-recover=all")
    set(CMAKE_EXE_LINKER_FLAGS "${CMAKE_EXE_LINKER_FLAGS} -fsanitize=address,undefined")
endif()

# Find vcpkg and its toolchain file
if(NOT CMAKE_TOOLCHAIN_FILE)
    find_package(VCPKG QUIET)
    if(VCPKG_FOUND)
        message(STATUS "VCPKG_FOUND: ${VCPKG_FOUND}")
        message(STATUS "VCPKG_TOOLCHAIN_FILE: ${VCPKG_TOOLCHAIN_FILE}")
    else()
        message(FATAL_ERROR "vcpkg not found. Please install vcpkg or specify CMAKE_TOOLCHAIN_FILE.")
    endif()
endif()

# Find packages provided by vcpkg
find_package(crow CONFIG REQUIRED)
find_package(libpqxx CONFIG REQUIRED)
find_package(spdlog CONFIG REQUIRED)
find_package(nlohmann_json CONFIG REQUIRED)
find_package(jwt-cpp CONFIG REQUIRED)
find_package(fmt CONFIG REQUIRED)
find_package(OpenSSL REQUIRED) # For jwt-cpp dependency

# Source files for the main application
set(APP_SRCS
    src/main.cpp
    src/config/config.hpp
    src/controllers/auth_controller.hpp
    src/controllers/data_controller.hpp
    src/controllers/model_controller.hpp
    src/controllers/user_controller.hpp
    src/services/auth_service.hpp
    src/services/ml_service.hpp
    src/services/user_service.hpp
    src/repositories/db_connection.hpp
    src/repositories/user_repository.hpp
    src/repositories/model_repository.hpp
    src/middleware/auth_middleware.hpp
    src/middleware/error_middleware.hpp
    src/middleware/logging_middleware.hpp
    src/middleware/ratelimit_middleware.hpp
    src/models/user.hpp
    src/models/ml_model.hpp
    src/models/data_point.hpp
    src/utils/jwt_manager.hpp
    src/utils/logger.hpp
    src/utils/cache_manager.hpp
    src/common/constants.hpp
)

# Add definitions for the main application executable
add_executable(ml_backend ${APP_SRCS})

# Link libraries to the main executable
target_link_libraries(ml_backend PRIVATE
    crow::crow
    pqxx::pqxx
    spdlog::spdlog
    nlohmann_json::nlohmann_json
    jwt-cpp::jwt-cpp
    fmt::fmt
    OpenSSL::SSL
    OpenSSL::Crypto
)

# Set include directories
target_include_directories(ml_backend PRIVATE
    ${CMAKE_CURRENT_SOURCE_DIR}/src
)

# Add subdirectory for tests
add_subdirectory(tests)

# Set output directory for executables
set(CMAKE_RUNTIME_OUTPUT_DIRECTORY "${CMAKE_BINARY_DIR}/bin")

# Copy .env.example to build directory for convenience
add_custom_command(TARGET ml_backend POST_BUILD
    COMMAND ${CMAKE_COMMAND} -E copy_if_different
    "${CMAKE_CURRENT_SOURCE_DIR}/.env.example"
    "${CMAKE_RUNTIME_OUTPUT_DIRECTORY}/.env.example"
    COMMENT "Copying .env.example to build directory"
)
```