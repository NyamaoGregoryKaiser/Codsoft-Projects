project(CMSSystemTests)

# Find Google Test
find_package(GTest CONFIG REQUIRED)

# Link to the main application's libraries
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Include main application's source directories
target_include_directories(${PROJECT_NAME} PUBLIC
    ${CMAKE_CURRENT_SOURCE_DIR}/../src
    ${CMAKE_CURRENT_SOURCE_DIR}/../src/controllers
    ${CMAKE_CURRENT_SOURCE_DIR}/../src/models
    ${CMAKE_CURRENT_SOURCE_DIR}/../src/services
    ${CMAKE_CURRENT_SOURCE_DIR}/../src/middleware
    ${CMAKE_CURRENT_SOURCE_DIR}/../src/utils
    ${CMAKE_CURRENT_SOURCE_DIR}/../src/common
    ${CMAKE_CURRENT_SOURCE_DIR}/../src/config
    ${CMAKE_CURRENT_SOURCE_DIR}/../src/database
    ${spdlog_SOURCE_DIR}/include
    ${jwt-cpp_SOURCE_DIR}/include
)

# Add unit tests
file(GLOB_RECURSE UNIT_TEST_SOURCES "${CMAKE_CURRENT_SOURCE_DIR}/unit/*.cc")
add_executable(unit_tests ${UNIT_TEST_SOURCES})
target_link_libraries(unit_tests PRIVATE GTest::gtest_main GTest::gtest Drogon::drogon hiredis::hiredis jwt-cpp spdlog::spdlog)

# Add integration tests
file(GLOB_RECURSE INTEGRATION_TEST_SOURCES "${CMAKE_CURRENT_SOURCE_DIR}/integration/*.cc")
add_executable(integration_tests ${INTEGRATION_TEST_SOURCES})
target_link_libraries(integration_tests PRIVATE GTest::gtest_main GTest::gtest Drogon::drogon hiredis::hiredis jwt-cpp spdlog::spdlog)

# Add custom test command to CTest
add_test(NAME run_unit_tests COMMAND unit_tests)
add_test(NAME run_integration_tests COMMAND integration_tests)

# For 80%+ coverage, you would integrate a tool like gcov/lcov here.
# Example for gcov/lcov:
# if(CMAKE_BUILD_TYPE STREQUAL "Debug")
#     target_compile_options(unit_tests PRIVATE --coverage)
#     target_link_libraries(unit_tests PRIVATE gcov)
#     target_compile_options(integration_tests PRIVATE --coverage)
#     target_link_libraries(integration_tests PRIVATE gcov)
# endif()
```