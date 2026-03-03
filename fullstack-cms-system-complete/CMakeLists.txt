```cmake
cmake_minimum_required(VERSION 3.10)
project(ApexContent)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_POSITION_INDEPENDENT_CODE ON) # Required for shared libraries and some deployments

# Find Drogon
find_package(Drogon REQUIRED)
message(STATUS "Drogon_INCLUDE_DIRS: ${Drogon_INCLUDE_DIRS}")
message(STATUS "Drogon_LIBRARIES: ${Drogon_LIBRARIES}")

# Find PostgreSQL (libpq)
find_package(PkgConfig QUIET)
if (PKG_CONFIG_FOUND)
    pkg_check_modules(LIBPQ QUIET libpq)
    if (LIBPQ_FOUND)
        message(STATUS "Found libpq: ${LIBPQ_LIBRARIES} ${LIBPQ_INCLUDE_DIRS}")
        set(POSTGRES_LIBRARIES ${LIBPQ_LIBRARIES})
        set(POSTGRES_INCLUDE_DIRS ${LIBPQ_INCLUDE_DIRS})
    else()
        message(WARNING "libpq not found via PkgConfig. Attempting manual find.")
    endif()
endif()

if (NOT POSTGRES_LIBRARIES)
    find_library(POSTGRES_LIBRARIES NAMES pq libpq HINTS /usr/local/lib /usr/lib)
    find_path(POSTGRES_INCLUDE_DIRS NAMES libpq-fe.h HINTS /usr/local/include /usr/include/postgresql)
    if (NOT POSTGRES_LIBRARIES OR NOT POSTGRES_INCLUDE_DIRS)
        message(FATAL_ERROR "PostgreSQL (libpq) not found. Please install libpq-dev or similar.")
    endif()
    message(STATUS "Found libpq manually: ${POSTGRES_LIBRARIES} ${POSTGRES_INCLUDE_DIRS}")
endif()

# Find Google Test for unit tests
find_package(GTest CONFIG REQUIRED)

# Define source files
set(CORE_SOURCES
    src/main.cc
    src/utils/Logger.cc
    src/utils/PasswordHasher.cc
    src/utils/JwtManager.cc
    src/services/AuthService.cc
    src/services/UserService.cc
    src/filters/AuthFilter.cc
    src/filters/RateLimitFilter.cc
    src/models/User.cc
    src/models/Role.cc
    src/models/UserRole.cc
    src/models/ContentType.cc
    src/models/ContentItem.cc
    src/models/MediaAsset.cc
    src/controllers/AuthController.cc
    src/controllers/UserController.cc
    src/controllers/ContentTypeController.cc
    src/controllers/ContentItemController.cc
    src/controllers/MediaAssetController.cc
)

# Set include directories
include_directories(
    src
    src/models
    src/controllers
    src/filters
    src/services
    src/utils
    ${Drogon_INCLUDE_DIRS}
    ${POSTGRES_INCLUDE_DIRS}
)

# Build the main application
add_executable(apexcontent ${CORE_SOURCES})
target_link_libraries(apexcontent
    Drogon::Drogon
    ${POSTGRES_LIBRARIES}
)

# Copy configuration and views
add_custom_command(TARGET apexcontent POST_BUILD
    COMMAND ${CMAKE_COMMAND} -E copy_directory ${CMAKE_CURRENT_SOURCE_DIR}/config $<TARGET_FILE_DIR:apexcontent>/config
    COMMAND ${CMAKE_COMMAND} -E copy_directory ${CMAKE_CURRENT_SOURCE_DIR}/src/views $<TARGET_FILE_DIR:apexcontent>/views
    COMMENT "Copying configuration and view files"
)

# Add unit tests
add_executable(run_unit_tests
    tests/unit/TestPasswordHasher.cc
    tests/unit/TestJwtManager.cc
)
target_link_libraries(run_unit_tests
    GTest::gtest_main
    GTest::gtest
    src/utils/PasswordHasher.cc # Link implementation directly for test
    src/utils/JwtManager.cc     # Link implementation directly for test
    src/utils/Logger.cc         # Link implementation directly for test
    ${Drogon_LIBRARIES}         # Link Drogon for any shared utility deps
)
```