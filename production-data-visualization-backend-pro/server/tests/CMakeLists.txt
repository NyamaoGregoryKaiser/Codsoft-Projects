cmake_minimum_required(VERSION 3.10)
project(DataVizProTests CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

find_package(GTest CONFIG REQUIRED)
find_package(Crow REQUIRED)
find_package(Pqxx REQUIRED)
find_package(nlohmann_json CONFIG REQUIRED)
find_package(spdlog CONFIG REQUIRED)
find_package(OpenSSL REQUIRED)

# Include directories from the main server
target_include_directories(DataVizProTests PRIVATE
    ${CMAKE_SOURCE_DIR}/src
    ${Crow_INCLUDE_DIRS}
)

# Test sources
set(TEST_SOURCES
    TestAuth.cpp
    TestDB.cpp
    TestDatasetService.cpp
    # Add more test files as you create them
)

add_executable(dataviz_tests ${TEST_SOURCES}
    ${CMAKE_SOURCE_DIR}/src/auth/AuthManager.cpp
    ${CMAKE_SOURCE_DIR}/src/db/DBManager.cpp
    ${CMAKE_SOURCE_DIR}/src/services/DatasetService.cpp
    ${CMAKE_SOURCE_DIR}/src/services/DataProcessingService.h # Only header needed
)

target_link_libraries(dataviz_tests
    GTest::gtest_main
    GTest::gtest
    Crow::Crow
    Pqxx::pqxx
    nlohmann_json::nlohmann_json
    spdlog::spdlog
    ${OpenSSL_LIBRARIES}
)
```