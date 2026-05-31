```cmake
cmake_minimum_required(VERSION 3.10)
project(ZenithPayments CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON) # For IDEs like VSCode

# --- Find external libraries ---
# httplib
include(FetchContent)
FetchContent_Declare(
  httplib
  GIT_REPOSITORY https://github.com/yhirose/cpp-httplib.git
  GIT_TAG        v0.12.0 # Use a specific tag
)
FetchContent_MakeAvailable(httplib)

# nlohmann_json
FetchContent_Declare(
  nlohmann_json
  GIT_REPOSITORY https://github.com/nlohmann/json.git
  GIT_TAG        v3.11.2
)
FetchContent_MakeAvailable(nlohmann_json)

# spdlog
FetchContent_Declare(
  spdlog
  GIT_REPOSITORY https://github.com/gabime/spdlog.git
  GIT_TAG        v1.12.0
)
FetchContent_MakeAvailable(spdlog)

# pqxx
find_package(PkgConfig QUIET)
if (PKG_CONFIG_FOUND)
    pkg_search_module(LIBPQXX QUIET libpqxx)
endif()

if (LIBPQXX_FOUND)
    message(STATUS "Found libpqxx: ${LIBPQXX_INCLUDE_DIRS}")
    include_directories(${LIBPQXX_INCLUDE_DIRS})
    link_directories(${LIBPQXX_LIBRARY_DIRS})
    set(LIBS_PQXX ${LIBPQXX_LIBRARIES})
else()
    # Fallback or error if not found. For this example, we assume system-installed.
    # In a real project, you might FetchContent it or provide instructions to install.
    message(FATAL_ERROR "libpqxx not found. Please install libpqxx-dev.")
endif()

# jwt-cpp
FetchContent_Declare(
  jwt_cpp
  GIT_REPOSITORY https://github.com/Thalhammer/jwt-cpp.git
  GIT_TAG        v0.6.0
)
FetchContent_MakeAvailable(jwt_cpp)


# --- Add source files ---
# Configuration
add_library(Config src/config/config.cpp src/config/config.hpp)

# Database Layer
add_library(DatabaseLayer STATIC
    src/database/db_connection.cpp src/database/db_connection.hpp
    src/database/repositories/user_repository.cpp src/database/repositories/user_repository.hpp
    src/database/repositories/payment_method_repository.cpp src/database/repositories/payment_method_repository.hpp
    src/database/repositories/transaction_repository.cpp src/database/repositories/transaction_repository.hpp
)
target_link_libraries(DatabaseLayer PUBLIC Config ${LIBS_PQXX})
target_include_directories(DatabaseLayer PUBLIC src/models) # Repositories need models

# Models
add_library(Models src/models/user.hpp src/models/payment_method.hpp src/models/transaction.hpp)

# Utilities
add_library(Utils STATIC
    src/utils/logger.hpp
    src/utils/jwt_manager.hpp src/utils/jwt_manager.cpp
    src/utils/cache_manager.hpp src/utils/cache_manager.cpp
    src/utils/common.hpp
)
target_link_libraries(Utils PUBLIC spdlog::spdlog jwt-cpp::jwt Config)

# Services (Business Logic)
add_library(Services STATIC
    src/services/user_service.cpp src/services/user_service.hpp
    src/services/payment_method_service.cpp src/services/payment_method_service.hpp
    src/services/transaction_service.cpp src/services/transaction_service.hpp
    src/services/payment_gateway_integrator.cpp src/services/payment_gateway_integrator.hpp
)
target_link_libraries(Services PUBLIC DatabaseLayer Models Utils)

# API Layer (Routes, Middleware)
add_library(ApiLayer STATIC
    src/api/auth_middleware.hpp src/api/rate_limiter_middleware.hpp src/api/error_handler.hpp
    src/api/routes.cpp src/api/routes.hpp
)
target_link_libraries(ApiLayer PUBLIC httplib::httplib nlohmann_json::nlohmann_json Utils Services)

# Main Application Executable
add_executable(zenith-payments src/main.cpp)
target_link_libraries(zenith-payments PUBLIC ApiLayer Services Utils DatabaseLayer Models Config)
target_include_directories(zenith-payments PUBLIC src)

# --- Unit Tests ---
enable_testing()
add_executable(tests tests/unit/user_service_test.cpp tests/unit/transaction_service_test.cpp tests/integration/db_repository_test.cpp tests/integration/api_integration_test.cpp)
target_link_libraries(tests PUBLIC zenith-payments) # Link against the main app or specific libs
# Find Catch2 for testing
FetchContent_Declare(
  Catch2
  GIT_REPOSITORY https://github.com/catchorg/Catch2.git
  GIT_TAG        v3.4.0
)
FetchContent_MakeAvailable(Catch2)
target_link_libraries(tests PRIVATE Catch2::Catch2WithMain)
target_include_directories(tests PRIVATE ${PROJECT_SOURCE_DIR}/src) # Allow tests to see src headers
```