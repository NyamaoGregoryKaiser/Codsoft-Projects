cmake_minimum_required(VERSION 3.10)
project(PaymentProcessor CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_POSITION_INDEPENDENT_CODE ON)

# Find Crow library
find_package(Crow REQUIRED)

# Find Pqxx library
find_package(PkgConfig REQUIRED)
pkg_check_modules(PQXX REQUIRED libpqxx)
include_directories(${PQXX_INCLUDE_DIRS})
link_directories(${PQXX_LIBRARY_DIRS})

# Find Spdlog library
find_package(spdlog REQUIRED)

# Find OpenSSL for JWT-CPP (if not found by jwt-cpp directly)
find_package(OpenSSL REQUIRED)

# Find JWT-CPP library
# You might need to add a find module for jwt-cpp or install it globally
# For simplicity, assuming it's available or built as a submodule
# If jwt-cpp is installed via a package manager, it might be found automatically
# Otherwise, you'd add its include and link paths here.
# For demonstration, we'll link against common names and assume it's installed.
# A common setup would be to add jwt-cpp as a Git submodule and add its CMake.
# For now, let's assume system-wide installation or manually specify.
# target_include_directories(PaymentProcessor PRIVATE ${CMAKE_SOURCE_DIR}/path/to/jwt-cpp/include)
# target_link_libraries(PaymentProcessor PRIVATE jwt-cpp)

# Source files
set(SOURCES
    src/main.cpp
    src/database/DBManager.cpp
    src/services/AuthService.cpp
    src/services/AccountService.cpp
    src/services/TransactionService.cpp
    src/controllers/AuthController.cpp
    src/controllers/AccountController.cpp
    src/controllers/TransactionController.cpp
    src/middleware/AuthMiddleware.cpp
    src/middleware/ErrorMiddleware.cpp
    src/utils/JWTUtils.cpp
)

add_executable(PaymentProcessor ${SOURCES})

# Link libraries
target_link_libraries(PaymentProcessor
    PRIVATE
    Crow::Crow
    ${PQXX_LIBRARIES}
    spdlog::spdlog
    ${OPENSSL_LIBRARIES}
    jwt-cpp # Assuming jwt-cpp library name, adjust if different
)

# Enable testing with Google Test
enable_testing()
find_package(GTest REQUIRED)
include_directories(${GTEST_INCLUDE_DIRS})

# Unit test sources
set(UNIT_TEST_SOURCES
    tests/unit/AuthService_test.cpp
    tests/unit/TransactionService_test.cpp
)

add_executable(PaymentProcessor_UnitTests ${UNIT_TEST_SOURCES})
target_link_libraries(PaymentProcessor_UnitTests
    PRIVATE
    gtest_main
    gtest
    PaymentProcessor # Link to the main executable to test its components
    Crow::Crow # Might be needed for some test setup, or remove if not.
    ${PQXX_LIBRARIES}
    spdlog::spdlog
    ${OPENSSL_LIBRARIES}
    jwt-cpp
)