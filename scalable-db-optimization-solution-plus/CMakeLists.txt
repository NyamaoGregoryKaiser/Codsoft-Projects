```cmake
cmake_minimum_required(VERSION 3.10)
project(OptiDB CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON) # For LSP tools like clangd

# Set build type defaults
if(NOT CMAKE_BUILD_TYPE)
    set(CMAKE_BUILD_TYPE Debug CACHE STRING "Choose the type of build."
        OPTIONS "Debug" "Release" "RelWithDebInfo" "MinSizeRel")
endif()

# FetchContent for external dependencies
include(FetchContent)

# 1. Crow Framework
FetchContent_Declare(
    crow_repo
    GIT_REPOSITORY https://github.com/ipkn/crow.git
    GIT_TAG        v1.0+5
)
FetchContent_MakeAvailable(crow_repo)

# 2. pqxx (PostgreSQL client)
find_package(PkgConfig QUIET)
if (PKG_CONFIG_FOUND)
    pkg_check_modules(libpqxx QUIET pqxx)
endif()

if (libpqxx_FOUND)
    message(STATUS "Found libpqxx via pkg-config")
    include_directories(${libpqxx_INCLUDE_DIRS})
    link_directories(${libpqxx_LIBRARY_DIRS})
    set(PQXX_LIBRARIES ${libpqxx_LIBRARIES})
else()
    # Fallback if pkg-config is not available or doesn't find it
    message(STATUS "libpqxx not found via pkg-config, attempting default find_library")
    find_library(PQXX_LIBRARY NAMES pqxx)
    find_path(PQXX_INCLUDE_DIR NAMES pqxx/pqxx Pqxx/pqxx.h)

    if (PQXX_LIBRARY AND PQXX_INCLUDE_DIR)
        message(STATUS "Found libpqxx headers at ${PQXX_INCLUDE_DIR}")
        message(STATUS "Found libpqxx library at ${PQXX_LIBRARY}")
        include_directories(${PQXX_INCLUDE_DIR})
        set(PQXX_LIBRARIES ${PQXX_LIBRARY})
    else()
        message(FATAL_ERROR "libpqxx not found. Please install libpqxx-dev (or similar) and its dependencies.")
    endif()
endif()

# 3. nlohmann/json (JSON library)
FetchContent_Declare(
    nlohmann_json
    GIT_REPOSITORY https://github.com/nlohmann/json.git
    GIT_TAG        v3.11.2
    SOURCE_DIR     ${CMAKE_BINARY_DIR}/nlohmann_json_src
)
FetchContent_MakeAvailable(nlohmann_json)
target_include_directories(nlohmann_json_project SYSTEM INTERFACE ${nlohmann_json_SOURCE_DIR}/include)

# 4. JWT-CPP (JSON Web Token library)
FetchContent_Declare(
    jwt_cpp
    GIT_REPOSITORY https://github.com/Thalhammer/jwt-cpp.git
    GIT_TAG        v0.6.0
)
FetchContent_MakeAvailable(jwt_cpp)
# jwt-cpp depends on OpenSSL (for hashing) and RapidJSON (for parsing)
find_package(OpenSSL REQUIRED)
# RapidJSON is often header-only or can be FetchContent'd if not provided by jwt-cpp's build.
# For jwt-cpp, usually it handles its own rapidjson dependency or expects it system-wide.
# We explicitly link OpenSSL.

# 5. Spdlog (Logging library)
FetchContent_Declare(
    spdlog_repo
    GIT_REPOSITORY https://github.com/gabime/spdlog.git
    GIT_TAG        v1.12.0
)
FetchContent_MakeAvailable(spdlog_repo)
target_link_libraries(spdlog_repo INTERFACE ${CMAKE_THREAD_LIBS_INIT})

# 6. BCrypt (Password Hashing) - C++ port
# Note: This is a standalone header-only or small source implementation.
# The one used in the example is a simple C++ port.
# If using a library like `bcrypt.hpp` from https://github.elad.info/bcrypt/
# It may just need to be included. If it's a separate library, FetchContent it.
# For simplicity, assuming a minimal bcrypt.hpp or similar directly included.
# For a full library:
FetchContent_Declare(
    bcrypt_cpp
    GIT_REPOSITORY https://github.com/eladboh/bcrypt.git
    GIT_TAG        v2.0
    SOURCE_DIR     ${CMAKE_BINARY_DIR}/bcrypt_cpp_src
)
FetchContent_MakeAvailable(bcrypt_cpp)
target_include_directories(bcrypt_cpp_project SYSTEM INTERFACE ${bcrypt_cpp_SOURCE_DIR})

# 7. Crypto++ (Encryption library for password_enc)
FetchContent_Declare(
    cryptopp
    GIT_REPOSITORY https://github.com/weidai11/cryptopp.git
    GIT_TAG        CRYPTOPP_8_9_0
)
FetchContent_MakeAvailable(cryptopp)


# Define source files for the application
file(GLOB_RECURSE SOURCES "src/*.cpp" "src/*.h")

add_executable(OptiDB ${SOURCES})

# Link libraries
target_link_libraries(OptiDB
    Crow
    ${PQXX_LIBRARIES}
    nlohmann_json_project
    jwt_cpp
    OpenSSL::SSL OpenSSL::Crypto # Link OpenSSL for jwt-cpp
    spdlog_repo
    bcrypt_cpp_project
    cryptopp_project
)

# Optional: Add testing executable
enable_testing()
add_subdirectory(tests)

# Set common compiler options
target_compile_features(OptiDB PUBLIC cxx_std_17)
target_compile_options(OptiDB PUBLIC
    $<$<CXX_COMPILER_ID:GNU,Clang>:-Wall -Wextra -Wpedantic -Wno-unused-parameter> # Common warnings
    $<$<CONFIG:Debug>:-g> # Debug symbols for debug builds
    $<$<CONFIG:Release>:-O3 -DNDEBUG> # Optimizations for release builds
)

# Install rules (optional for package managers)
install(TARGETS OptiDB DESTINATION bin)
install(DIRECTORY ${CMAKE_SOURCE_DIR}/db_migrations DESTINATION share/optidb)

```