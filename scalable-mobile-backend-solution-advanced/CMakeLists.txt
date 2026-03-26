```cmake
cmake_minimum_required(VERSION 3.10 FATAL_ERROR)
project(MobileBackend CXX)

# Set C++ standard
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_POSITION_INDEPENDENT_CODE ON)

# Find Drogon
find_package(Drogon REQUIRED)

# Find spdlog
find_package(spdlog CONFIG REQUIRED)

# Find jsoncpp (Drogon usually pulls this, but explicit is good)
find_package(jsoncpp CONFIG REQUIRED)

# Find hiredis (Redis client)
find_package(Hiredis REQUIRED)

# Find jwt-cpp (JWT library)
# This might need manual download or a vcpkg setup if not available via find_package
# For simplicity, we'll assume it's installed or provided, or link directly
# If you use vcpkg, it would be 'find_package(jwt-cpp CONFIG REQUIRED)'
# For this example, we'll assume it's available or integrate as a vendored lib if complex
# Let's assume it's discoverable or link directly
# A more robust solution might use FetchContent or vcpkg
add_subdirectory(externals/jwt-cpp EXCLUDE_FROM_ALL) # Assuming jwt-cpp is a submodule or vendored lib
# Need to adjust this based on actual jwt-cpp structure. For this example, let's link its headers.
# For jwt-cpp, it's often header-only or very simple.
# For simplicity, assume it's integrated via `add_subdirectory` or `vcpkg`.
# If `find_package(jwt-cpp)` doesn't work, one might need to build it or include its headers.
# For this demonstration, we'll treat it as a library to link.
# We'll mock 'find_package(jwt-cpp)' for this example and specify include/link dirs later.
# For a real project: vcpkg install jwt-cpp

# Find bcrypt-cpp
# Same as jwt-cpp, often not easily findable. We'll use a direct source inclusion strategy or vcpkg.
# add_subdirectory(externals/bcrypt-cpp EXCLUDE_FROM_ALL) # Assuming bcrypt-cpp is a submodule or vendored lib
# For bcrypt-cpp, it's usually `libbcrypt` from a system package manager or vendored.
# We'll assume libbcrypt is available and link against it.
find_package(PkgConfig REQUIRED)
pkg_check_modules(LIBCRYPT REQUIRED libbcrypt)

# Configure build type
if(NOT CMAKE_BUILD_TYPE AND NOT CMAKE_CONFIGURATION_TYPES)
  message(STATUS "Setting build type to 'Release' as none was specified.")
  set(CMAKE_BUILD_TYPE Release CACHE STRING "Choose the type of build." ONETOGGLE
      "Debug;Release;MinSizeRel;RelWithDebInfo")
endif()

# Source files for the main application
set(APP_SOURCES
    src/main.cc
    src/config/ConfigManager.cc
    src/utils/Logger.cc
    src/utils/PasswordHasher.cc
    src/utils/JwtManager.cc
    src/database/DBManager.cc
    src/repositories/UserRepository.cc
    src/repositories/ProductRepository.cc
    src/repositories/OrderRepository.cc
    src/services/AuthService.cc
    src/services/UserService.cc
    src/services/ProductService.cc
    src/services/OrderService.cc
    src/services/CacheService.cc
    src/filters/AuthFilter.cc
    src/filters/RateLimitFilter.cc
    src/controllers/AuthController.cc
    src/controllers/UserController.cc
    src/controllers/ProductController.cc
    src/controllers/OrderController.cc
    src/controllers/RootController.cc
)

# Add executable for the main application
add_executable(${PROJECT_NAME} ${APP_SOURCES})

# Include directories
target_include_directories(${PROJECT_NAME} PUBLIC
    ${CMAKE_SOURCE_DIR}/src
    ${CMAKE_SOURCE_DIR}/src/config
    ${CMAKE_SOURCE_DIR}/src/utils
    ${CMAKE_SOURCE_DIR}/src/models
    ${CMAKE_SOURCE_DIR}/src/database
    ${CMAKE_SOURCE_DIR}/src/repositories
    ${CMAKE_SOURCE_DIR}/src/services
    ${CMAKE_SOURCE_DIR}/src/filters
    ${CMAKE_SOURCE_DIR}/src/controllers
    # Add external JWT-CPP include if not using vcpkg
    # For jwt-cpp, assuming it's in `externals/jwt-cpp/include` if vendored
    # ${CMAKE_SOURCE_DIR}/externals/jwt-cpp/include
)

# Link libraries
target_link_libraries(${PROJECT_NAME} PUBLIC
    Drogon::Drogon
    spdlog::spdlog
    jsoncpp::jsoncpp # Explicitly link jsoncpp
    Hiredis::Hiredis
    ${LIBCRYPT_LDFLAGS} # libbcrypt
    # For jwt-cpp, if it's a library target
    # jwt-cpp::jwt-cpp
)

# Add Google Test for unit tests
find_package(GTest CONFIG REQUIRED)
add_subdirectory(tests)

# Code coverage (for GCC/Clang)
if (CMAKE_BUILD_TYPE MATCHES "Debug|Coverage")
    target_compile_options(${PROJECT_NAME} PRIVATE --coverage -O0 -g)
    target_link_options(${PROJECT_NAME} PRIVATE --coverage)
endif()

# Install rules (optional, for deployment)
install(TARGETS ${PROJECT_NAME} DESTINATION bin)
install(FILES config/drogon_config.json DESTINATION etc/${PROJECT_NAME})
```