cmake_minimum_required(VERSION 3.10)
project(cms-cpp)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_BUILD_TYPE Debug) # Can be Release for production

# Find Drogon
find_package(Drogon REQUIRED)

# Find jsoncpp for JWT parsing (Drogon might bring its own or needs external)
find_package(Jsoncpp CONFIG REQUIRED)

# Find Boost for bcrypt (or use a standalone bcrypt lib)
# Drogon's JWT uses jwt-cpp which doesn't directly use boost, but for hashing (bcrypt) we need a library.
# For simplicity, we'll use a direct bcrypt-cpp implementation or assume its presence.
# For this example, we'll rely on bcrypt-cpp headers included directly or a simple wrapper.
# If using a full bcrypt library, it would be linked here.
# For this example, we'll assume bcrypt library (like `libbcrypt`) is available.
# Otherwise, using simple placeholder hash or a small header-only lib like argon2.
# For simplicity, let's include bcrypt-cpp as a part of the project
# For better project structure, it should be a submodule or dependency.
# Assuming a `bcrypt.h` and `bcrypt.cpp` or similar files are placed in `utils/` or included
# or linking against `libbcrypt` if available on system
# find_library(BCRYPT_LIBRARY bcrypt) # If linking against a system-wide lib

# Include directories
include_directories(${Drogon_INCLUDE_DIRS})
include_directories(${CMAKE_SOURCE_DIR}) # For accessing project headers easily
include_directories(${CMAKE_SOURCE_DIR}/controllers)
include_directories(${CMAKE_SOURCE_DIR}/models)
include_directories(${CMAKE_SOURCE_DIR}/services)
include_directories(${CMAKE_SOURCE_DIR}/middlewares)
include_directories(${CMAKE_SOURCE_DIR}/utils)

# Source files
set(APP_SOURCES
    main.cc
    controllers/AuthController.cc
    controllers/ContentController.cc
    controllers/UserController.cc
    services/UserService.cc
    services/ContentService.cc
    middlewares/AuthMiddleware.cc
    middlewares/RateLimitMiddleware.cc
    middlewares/ErrorHandlingMiddleware.cc
    middlewares/CachingMiddleware.cc
    utils/JwtManager.cc
    utils/PasswordHasher.cc
)

# Add the executable
add_executable(${PROJECT_NAME} ${APP_SOURCES})

# Link libraries
target_link_libraries(${PROJECT_NAME}
    PRIVATE
        Drogon::Drogon
        Jsoncpp::jsoncpp # For jwt-cpp if needed, Drogon usually handles this
        # Add bcrypt library if using one
)

# Copy config.json to build directory
add_custom_command(TARGET ${PROJECT_NAME} POST_BUILD
    COMMAND ${CMAKE_COMMAND} -E copy_if_different
    ${CMAKE_SOURCE_DIR}/config.json
    $<TARGET_FILE_DIR:${PROJECT_NAME}>/config.json
)

# Copy static frontend files to build directory
add_custom_command(TARGET ${PROJECT_NAME} POST_BUILD
    COMMAND ${CMAKE_COMMAND} -E copy_directory
    ${CMAKE_SOURCE_DIR}/../static
    $<TARGET_FILE_DIR:${PROJECT_NAME}>/static
)

# Optional: Add compiler flags for warnings
if(CMAKE_CXX_COMPILER_ID MATCHES "GNU|Clang")
    target_compile_options(${PROJECT_NAME} PRIVATE
        -Wall
        -Wextra
        -Wpedantic
        -Werror # Treat warnings as errors
    )
endif()