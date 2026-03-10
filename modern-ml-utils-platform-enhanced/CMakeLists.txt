```cmake
cmake_minimum_required(VERSION 3.10)
project(MLOpsCoreService CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED True)
set(CMAKE_POSITION_INDEPENDENT_CODE ON) # Required for shared libraries and some build setups

# --- Directories ---
set(PROJECT_ROOT_DIR ${CMAKE_SOURCE_DIR})
set(SRC_DIR ${PROJECT_ROOT_DIR}/src)
set(TESTS_DIR ${PROJECT_ROOT_DIR}/tests)
set(THIRD_PARTY_DIR ${SRC_DIR}/third_party)
set(DATA_DIR ${PROJECT_ROOT_DIR}/data)
set(LOGS_DIR ${PROJECT_ROOT_DIR}/logs)
set(MODELS_DIR ${PROJECT_ROOT_DIR}/models)

# Create necessary directories
file(MAKE_DIRECTORY ${DATA_DIR})
file(MAKE_DIRECTORY ${LOGS_DIR})
file(MAKE_DIRECTORY ${MODELS_DIR})

# --- Include Directories ---
include_directories(
    ${SRC_DIR}
    ${THIRD_PARTY_DIR}/crow
    ${THIRD_PARTY_DIR}/nlohmann/json/single_include
    ${THIRD_PARTY_DIR}/sqlite_orm
    ${THIRD_PARTY_DIR}/jwt-cpp/include # For jwt-cpp
    ${THIRD_PARTY_DIR}/googletest/googletest/include # For Google Test
    ${THIRD_PARTY_DIR}/googletest/googlemock/include # For Google Mock (if used)
)

# --- Source Files ---
set(APP_SOURCES
    ${SRC_DIR}/main.cpp
    ${SRC_DIR}/utils/Config.cpp
    ${SRC_DIR}/database/DatabaseManager.cpp
    ${SRC_DIR}/core/PredictionService.cpp
    ${SRC_DIR}/core/Model.cpp
    ${SRC_DIR}/core/Cache.cpp
    ${SRC_DIR}/api/APIController.cpp
    ${SRC_DIR}/api/AuthMiddleware.cpp
    ${SRC_DIR}/api/ErrorHandler.cpp
)

# --- Libraries ---
# Link SQLite3, required by sqlite_orm
find_package(SQLite3 REQUIRED)
if(SQLITE3_FOUND)
    message(STATUS "Found SQLite3: ${SQLITE3_LIBRARIES}")
    set(LIBS_TO_LINK ${LIBS_TO_LINK} ${SQLite3_LIBRARIES})
else()
    message(FATAL_ERROR "SQLite3 not found. Please install libsqlite3-dev or similar.")
endif()

# Link pthreads for Crow (and others on Linux/macOS)
find_package(Threads REQUIRED)
set(LIBS_TO_LINK ${LIBS_TO_LINK} ${CMAKE_THREAD_LIBS_INIT})

# Add jwt-cpp library (header-only, but sometimes needs specific compiler flags or linking)
# Since jwt-cpp is mostly header-only, we just include its directory.
# For some environments, OpenSSL might be implicitly linked.
# You might need to add `find_package(OpenSSL REQUIRED)` and link `${OPENSSL_LIBRARIES}` if you encounter linker errors.

# --- Executable ---
add_executable(mlops-core-service ${APP_SOURCES})
target_link_libraries(mlops-core-service ${LIBS_TO_LINK})

# --- Testing ---
enable_testing()

# Include Google Test
add_subdirectory(${THIRD_PARTY_DIR}/googletest)

# Unit Test Sources
set(UNIT_TEST_SOURCES
    ${TESTS_DIR}/unit/TestModel.cpp
    ${TESTS_DIR}/unit/TestPredictionService.cpp
    ${TESTS_DIR}/unit/TestCache.cpp
    ${TESTS_DIR}/unit/TestDatabaseManager.cpp
)

add_executable(mlops-unit-tests ${UNIT_TEST_SOURCES})
target_link_libraries(mlops-unit-tests gtest gtest_main ${LIBS_TO_LINK}) # Link with gtest and gtest_main for the main() function
add_test(NAME unit_tests COMMAND mlops-unit-tests)
```