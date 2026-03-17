cmake_minimum_required(VERSION 3.10)
project(CMSSystem VERSION 1.0)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_POSITION_INDEPENDENT_CODE ON)

# Configure build type (Debug/Release)
if(NOT CMAKE_BUILD_TYPE)
    set(CMAKE_BUILD_TYPE Release)
endif()

# Set output directories
set(CMAKE_RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/bin)
set(CMAKE_LIBRARY_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/lib)
set(CMAKE_ARCHIVE_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/lib)

# Fetch Drogon
find_package(Drogon CONFIG REQUIRED)

# Fetch spdlog
include(FetchContent)
FetchContent_Declare(
  spdlog
  GIT_REPOSITORY https://github.com/gabime/spdlog.git
  GIT_TAG        v1.13.0
  GIT_SHALLOW    TRUE
)
FetchContent_MakeAvailable(spdlog)

# Fetch hiredis (for Redis integration)
FetchContent_Declare(
  hiredis
  GIT_REPOSITORY https://github.com/redis/hiredis.git
  GIT_TAG        v1.2.0
  GIT_SHALLOW    TRUE
)
FetchContent_MakeAvailable(hiredis)

# Add JWT-CPP (for JWT token handling)
FetchContent_Declare(
  jwt-cpp
  GIT_REPOSITORY https://github.com/Thalhammer/jwt-cpp.git
  GIT_TAG        v0.8.0
  GIT_SHALLOW    TRUE
)
FetchContent_MakeAvailable(jwt-cpp)

# Define source directories
set(SOURCE_DIR ${CMAKE_CURRENT_SOURCE_DIR}/src)
set(CONTROLLERS_DIR ${SOURCE_DIR}/controllers)
set(MODELS_DIR ${SOURCE_DIR}/models)
set(SERVICES_DIR ${SOURCE_DIR}/services)
set(MIDDLEWARE_DIR ${SOURCE_DIR}/middleware)
set(UTILS_DIR ${SOURCE_DIR}/utils)
set(COMMON_DIR ${SOURCE_DIR}/common)
set(CONFIG_DIR ${SOURCE_DIR}/config)
set(DATABASE_DIR ${SOURCE_DIR}/database)

# Collect all source files
file(GLOB_RECURSE APP_SOURCES
    ${SOURCE_DIR}/*.cc
    ${SOURCE_DIR}/*.cpp
    ${CONTROLLERS_DIR}/*.cc
    ${CONTROLLERS_DIR}/*.cpp
    ${MODELS_DIR}/*.cc
    ${MODELS_DIR}/*.cpp
    ${SERVICES_DIR}/*.cc
    ${SERVICES_DIR}/*.cpp
    ${MIDDLEWARE_DIR}/*.cc
    ${MIDDLEWARE_DIR}/*.cpp
    ${UTILS_DIR}/*.cc
    ${UTILS_DIR}/*.cpp
    ${COMMON_DIR}/*.cc
    ${COMMON_DIR}/*.cpp
    ${CONFIG_DIR}/*.cc
    ${CONFIG_DIR}/*.cpp
    ${DATABASE_DIR}/*.cc
    ${DATABASE_DIR}/*.cpp
)

# Add executable target
add_executable(${PROJECT_NAME} ${APP_SOURCES})

# Include directories
target_include_directories(${PROJECT_NAME} PUBLIC
    ${SOURCE_DIR}
    ${CONTROLLERS_DIR}
    ${MODELS_DIR}
    ${SERVICES_DIR}
    ${MIDDLEWARE_DIR}
    ${UTILS_DIR}
    ${COMMON_DIR}
    ${CONFIG_DIR}
    ${DATABASE_DIR}
    ${spdlog_SOURCE_DIR}/include
    ${jwt-cpp_SOURCE_DIR}/include
)

# Link libraries
target_link_libraries(${PROJECT_NAME} PRIVATE
    Drogon::drogon
    spdlog::spdlog
    hiredis::hiredis
    jwt-cpp
)

# Copy configuration files to build directory
file(GLOB CONFIG_FILES "${CMAKE_CURRENT_SOURCE_DIR}/config/*.json")
add_custom_command(TARGET ${PROJECT_NAME} POST_BUILD
    COMMAND ${CMAKE_COMMAND} -E copy ${CONFIG_FILES} $<TARGET_FILE_DIR:${PROJECT_NAME}>/config/
    COMMAND_EXPAND_LISTS
    COMMENT "Copying configuration files"
)

# Add a subdirectory for tests
add_subdirectory(tests)

# Drogon generates model files, add a custom command for it
add_custom_command(
    TARGET ${PROJECT_NAME} PRE_BUILD
    COMMAND ${CMAKE_COMMAND} -E make_directory ${CMAKE_CURRENT_SOURCE_DIR}/src/models
    COMMAND drogon_ctl gen_model -o ${CMAKE_CURRENT_SOURCE_DIR}/src/models -d default
    WORKING_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}
    COMMENT "Generating Drogon models"
)

# Additional compiler flags for better warnings and security
if(CMAKE_CXX_COMPILER_ID MATCHES "GNU|Clang")
    target_compile_options(${PROJECT_NAME} PRIVATE
        -Wall -Wextra -Wpedantic -Wconversion -Wshadow -Wno-unused-parameter
        -Wno-deprecated-declarations -Wnon-virtual-dtor -Wold-style-cast
        -Wsuggest-override -Wctor-dtor-privacy -Wformat=2
        $<$<CONFIG:Debug>:-Og -g>
        $<$<CONFIG:Release>:-O3 -DNDEBUG>
    )
endif()
```