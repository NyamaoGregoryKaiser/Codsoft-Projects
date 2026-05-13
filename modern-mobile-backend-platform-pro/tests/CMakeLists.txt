```cmake
# Build Google Test framework
include(GoogleTest)
gtest_discover_tests(UnitTests)
gtest_discover_tests(IntegrationTests)
gtest_discover_tests(ApiTests)

# --- Unit Tests ---
add_executable(UnitTests unit/TestPasswordUtils.cc unit/TestJWTUtils.cc unit/TestAppConfig.cc unit/TestCache.cc unit/TestRateLimiter.cc)
target_link_libraries(UnitTests PRIVATE
    GTest::gtest_main
    ${PROJECT_NAME} # Link to the main application for access to utils, models, etc.
)
target_include_directories(UnitTests PRIVATE ${CMAKE_SOURCE_DIR}/src)

# --- Integration Tests (requires a database) ---
add_executable(IntegrationTests integration/TestDAOsIntegration.cc)
target_link_libraries(IntegrationTests PRIVATE
    GTest::gtest_main
    ${PROJECT_NAME} # Link to the main application
)
target_include_directories(IntegrationTests PRIVATE ${CMAKE_SOURCE_DIR}/src)

# --- API Tests (requires a running server) ---
add_executable(ApiTests api/TestAuthAPI.cc) # Example, add more for other controllers
target_link_libraries(ApiTests PRIVATE
    GTest::gtest_main
    ${PROJECT_NAME} # Link to the main application
)
target_include_directories(ApiTests PRIVATE ${CMAKE_SOURCE_DIR}/src)

```