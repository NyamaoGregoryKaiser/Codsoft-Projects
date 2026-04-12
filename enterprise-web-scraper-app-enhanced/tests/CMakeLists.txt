```cmake
# CMakeLists.txt for tests subdirectory

add_executable(scraper_tests
    unit/TestAuthManager.cpp
    unit/TestConfigManager.cpp
    unit/TestScraper.cpp
    unit/TestDatabaseManager.cpp
    integration/TestApiIntegration.cpp
    perf/perf_test.cpp # Placeholder, often performance tests are separate
)

target_link_libraries(scraper_tests
    GTest::gtest_main
    scraper_backend # Link against the main application for testing internal components
)

# Ensure test executable can find app headers and libraries
target_include_directories(scraper_tests PRIVATE
    ${CMAKE_CURRENT_SOURCE_DIR}/../src
)

# Performance test as a separate target, typically not run with regular unit tests
# add_executable(scraper_perf_tests perf/perf_test.cpp)
# target_link_libraries(scraper_perf_tests scraper_backend)

# Add tests for CTest
add_test(NAME UnitAndIntegrationTests COMMAND scraper_tests)
# add_test(NAME PerformanceTests COMMAND scraper_perf_tests) # If perf_test is a separate executable

```