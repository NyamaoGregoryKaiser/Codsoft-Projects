```cmake
cmake_minimum_required(VERSION 3.10)
project(AuthSystem CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

# Find SQLite3
find_package(SQLite3 REQUIRED)

# Add Crow as a submodule or download it
# For simplicity, we'll assume Crow is available (e.g., via vcpkg or manually cloned)
# If using vcpkg: find_package(crow REQUIRED)
# If manual:
include(FetchContent)
FetchContent_Declare(
    crow
    GIT_REPOSITORY https://github.com/CrowCpp/Crow.git
    GIT_TAG        v1.0+5
)
FetchContent_MakeAvailable(crow)

# Find or add jwt-cpp
# For simplicity, assume it's available via vcpkg or system
# If using vcpkg: find_package(jwt-cpp REQUIRED)
# If manual:
FetchContent_Declare(
    jwt_cpp
    GIT_REPOSITORY https://github.com/Thalhammer/jwt-cpp.git
    GIT_TAG        v0.6.0 # Or the latest stable tag
)
FetchContent_MakeAvailable(jwt_cpp)

# Find or add argon2-cpp
# If using vcpkg: find_package(argon2-cpp REQUIRED)
# If manual:
FetchContent_Declare(
    argon2_cpp
    GIT_REPOSITORY https://github.com/mjosaarinen/argon2-cpp.git
    GIT_TAG        v1.0.0 # Or the latest stable tag
)
FetchContent_MakeAvailable(argon2_cpp)
# argon2-cpp requires libargon2. For build on Linux: sudo apt-get install libargon2-dev
# If FetchContent doesn't build libargon2 itself, you might need to install it.

# Define source directories
set(APP_SRCS
    src/main.cpp
    src/config/Config.cpp
    src/database/Database.cpp
    src/models/User.cpp
    src/auth/AuthService.cpp
    src/auth/AuthMiddleware.cpp
    src/controllers/AuthController.cpp
    src/controllers/UserController.cpp
    src/utils/Logger.cpp
    src/utils/ErrorHandlingMiddleware.cpp
    src/utils/JsonUtils.cpp
)

# Include directories
include_directories(
    ${CMAKE_CURRENT_SOURCE_DIR}/src
    ${CMAKE_CURRENT_SOURCE_DIR}/src/config
    ${CMAKE_CURRENT_SOURCE_DIR}/src/database
    ${CMAKE_CURRENT_SOURCE_DIR}/src/models
    ${CMAKE_CURRENT_SOURCE_DIR}/src/auth
    ${CMAKE_CURRENT_SOURCE_DIR}/src/controllers
    ${CMAKE_CURRENT_SOURCE_DIR}/src/utils
    ${CMAKE_CURRENT_SOURCE_DIR}/src/middleware
    ${SQLite3_INCLUDE_DIR}
    ${crow_SOURCE_DIR}/include # Ensure Crow's include path is set
    ${jwt_cpp_SOURCE_DIR}/include # Ensure jwt-cpp's include path is set
    ${argon2_cpp_SOURCE_DIR}/include # Ensure argon2-cpp's include path is set
)

# Add executable
add_executable(AuthSystem ${APP_SRCS})

# Link libraries
target_link_libraries(AuthSystem
    PRIVATE
    crow
    jwt-cpp
    argon2-cpp
    ${SQLite3_LIBRARIES}
)

# Setup for testing with Google Test
enable_testing()
FetchContent_Declare(
  googletest
  GIT_REPOSITORY https://github.com/google/googletest.git
  GIT_TAG        release-1.11.0
)
FetchContent_MakeAvailable(googletest)

# Define test sources
set(TEST_SRCS
    tests/test_main.cpp
    tests/test_auth_service.cpp
    tests/test_database.cpp
    tests/test_user_model.cpp
)

add_executable(AuthSystemTests ${TEST_SRCS})
target_link_libraries(AuthSystemTests
    PRIVATE
    gtest_main
    gtest
    AuthSystem # Link against the main app to access its components
)

# Set common compile options
target_compile_options(AuthSystem PRIVATE -Wall -Wextra -pedantic)
target_compile_options(AuthSystemTests PRIVATE -Wall -Wextra -pedantic)

# If building on Linux, you might need to link libargon2
# check_library_exists(argon2 argon2_hash "" ARGON2_LIB)
# if(ARGON2_LIB)
#   target_link_libraries(AuthSystem PRIVATE ${ARGON2_LIB})
#   target_link_libraries(AuthSystemTests PRIVATE ${ARGON2_LIB})
# endif()
# For argon2-cpp to link to libargon2:
# If you install libargon2-dev (ubuntu) or argon2 (arch), CMake should find it.
# If not, you might need to specify its path or add a `find_package(Argon2 REQUIRED)` if available.
# A common issue is the argon2-cpp CMakeLists.txt not explicitly linking libargon2
# You might need to add: target_link_libraries(argon2-cpp PRIVATE argon2) in its CMakeLists.txt
# or directly link here if argon2-cpp target doesn't propagate it:
find_library(ARGON2_LIBRARY NAMES argon2)
if(ARGON2_LIBRARY)
    target_link_libraries(AuthSystem PRIVATE ${ARGON2_LIBRARY})
    target_link_libraries(AuthSystemTests PRIVATE ${ARGON2_LIBRARY})
else()
    message(WARNING "libargon2 not found. Argon2 hashing might fail. Please install libargon2-dev or equivalent.")
endif()


# Copy migration files to build directory
add_custom_command(TARGET AuthSystem POST_BUILD
    COMMAND ${CMAKE_COMMAND} -E copy_directory
    ${CMAKE_CURRENT_SOURCE_DIR}/src/database/migrations
    $<TARGET_FILE_DIR:AuthSystem>/migrations
)
```