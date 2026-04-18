```cmake
cmake_minimum_required(VERSION 3.10)
project(PerfoMetricsBackend CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_POSITION_INDEPENDENT_CODE ON)

# Find nlohmann/json
find_package(nlohmann_json CONFIG REQUIRED)
target_link_libraries(${PROJECT_NAME} PRIVATE nlohmann_json::nlohmann_json)

# Find spdlog
find_package(spdlog CONFIG REQUIRED)
target_link_libraries(${PROJECT_NAME} PRIVATE spdlog::spdlog)

# Find libpqxx (for PostgreSQL)
find_package(PkgConfig REQUIRED)
pkg_check_modules(LIBPQXX REQUIRED libpqxx)
if (LIBPQXX_FOUND)
    include_directories(${LIBPQXX_INCLUDE_DIRS})
    link_directories(${LIBPQXX_LIBRARY_DIRS})
    add_definitions(${LIBPQXX_CFLAGS_OTHER})
    set(LIBS ${LIBS} ${LIBPQXX_LIBRARIES})
else()
    message(FATAL_ERROR "libpqxx not found!")
endif()

# Find jwt-cpp
# Assuming jwt-cpp is installed via conan, vcpkg or manually in a common path
# For simplicity, assuming a system-wide or project-local include/lib path
find_path(JWT_CPP_INCLUDE_DIR jwt-cpp/jwt.h)
find_library(JWT_CPP_LIBRARY jwt) # Or provide full path
if (JWT_CPP_INCLUDE_DIR AND JWT_CPP_LIBRARY)
    include_directories(${JWT_CPP_INCLUDE_DIR})
    link_libraries(${JWT_CPP_LIBRARY})
else()
    message(WARNING "jwt-cpp not found. Authentication features might be limited or require manual linking.")
    # For demonstration, we'll proceed but in a real project, this would be FATAL_ERROR
endif()


# Find Crow (assuming installed system-wide or vendored)
# Crow is header-only mostly, but if you build it separately, link its library.
# For simplicity, we'll assume it's header-only and paths are set.
# If using a specific Crow installation, you might need:
# find_package(Crow CONFIG REQUIRED)
# target_link_libraries(${PROJECT_NAME} PRIVATE Crow::Crow)

# Manually add Crow include path if not found via find_package
# Example for a vendored Crow (e.g., in `backend/deps/crow_include`):
# include_directories(${CMAKE_CURRENT_SOURCE_DIR}/deps/crow_include)


# Source files
set(SOURCE_FILES
    src/main.cpp
    src/server/Server.cpp
    src/services/MetricService.cpp
    src/services/AuthService.cpp
    src/services/AlertingService.cpp
    src/db/DBManager.cpp
    src/middleware/AuthMiddleware.cpp
    src/middleware/RateLimitMiddleware.cpp
    src/utils/Logger.cpp
    src/utils/Config.cpp
)

add_executable(${PROJECT_NAME} ${SOURCE_FILES})

# Link libraries
target_link_libraries(${PROJECT_NAME} PRIVATE
    ${LIBS} # For libpqxx
    jwt
)

# Add Google Test if you plan to build tests within the same CMake project
# find_package(GTest CONFIG)
# if (GTest_FOUND)
#     enable_testing()
#     add_subdirectory(tests/unit)
# endif()
```