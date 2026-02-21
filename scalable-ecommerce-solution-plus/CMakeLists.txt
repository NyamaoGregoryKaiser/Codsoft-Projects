```cmake
cmake_minimum_required(VERSION 3.16)
project(ECommerceSystem VERSION 1.0.0)

# Set C++ standard
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_POSITION_INDEPENDENT_CODE ON) # Required for shared libraries and some deployments

# Include Conan generated file
list(APPEND CMAKE_MODULE_PATH "${CMAKE_BINARY_DIR}")
find_package(Drogon CONFIG REQUIRED)
find_package(spdlog CONFIG REQUIRED)
find_package(jwt-cpp CONFIG REQUIRED)
find_package(hiredis CONFIG REQUIRED) # For Redis client

# Main application executable
add_executable(${PROJECT_NAME})

# Source files
set(APP_SOURCES
    src/main.cc
    src/controllers/ProductController.cc
    src/controllers/UserController.cc
    src/controllers/OrderController.cc
    src/services/ProductService.cc
    src/services/UserService.cc
    src/services/OrderService.cc
    src/dal/ProductDAL.cc
    src/dal/UserDAL.cc
    src/dal/OrderDAL.cc
    src/utils/JwtManager.cc
    src/utils/PasswordHasher.cc
    src/middleware/AuthMiddleware.cc
    src/middleware/LoggingMiddleware.cc
    src/middleware/RateLimitMiddleware.cc
    # Add all .cc files here
)

# Add headers to include path for convenience, though explicit linking is better
target_include_directories(${PROJECT_NAME} PRIVATE
    ${PROJECT_SOURCE_DIR}/src
    ${PROJECT_SOURCE_DIR}/src/controllers
    ${PROJECT_SOURCE_DIR}/src/services
    ${PROJECT_SOURCE_DIR}/src/dal
    ${PROJECT_SOURCE_DIR}/src/models
    ${PROJECT_SOURCE_DIR}/src/utils
    ${PROJECT_SOURCE_DIR}/src/middleware
    ${PROJECT_SOURCE_DIR}/src/exceptions
)

# Link Drogon and other libraries
target_link_libraries(${PROJECT_NAME}
    PRIVATE
    Drogon::Drogon # Drogon framework
    spdlog::spdlog  # Logging
    jwt-cpp         # JWT
    hiredis         # Redis client
    pq               # PostgreSQL client used by Drogon (or libpq)
    # Add any other libraries here
)

# Copy configuration files to build directory
file(COPY config/app.json DESTINATION ${CMAKE_BINARY_DIR}/config)
file(COPY config/log_config.json DESTINATION ${CMAKE_BINARY_DIR}/config)

# For running tests
add_subdirectory(tests)
```