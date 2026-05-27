add_executable(unit_tests
    unit/auth_service_test.cpp
    unit/ml_service_test.cpp
)

# Link necessary libraries for unit tests
target_link_libraries(unit_tests PRIVATE
    gtest_main
    gtest
    ml_backend # Link against main application's components
    crow::crow
    pqxx::pqxx
    spdlog::spdlog
    nlohmann_json::nlohmann_json
    jwt-cpp::jwt-cpp
    fmt::fmt
    OpenSSL::SSL
    OpenSSL::Crypto
)

# Set include directories for tests
target_include_directories(unit_tests PRIVATE
    ${CMAKE_CURRENT_SOURCE_DIR}/../
)

# Integration tests (example, might need more setup like a separate test DB)
add_executable(integration_tests
    integration/api_integration_test.cpp
)

target_link_libraries(integration_tests PRIVATE
    gtest_main
    gtest
    ml_backend # Link against main application's components
    crow::crow
    pqxx::pqxx
    spdlog::spdlog
    nlohmann_json::nlohmann_json
    jwt-cpp::jwt-cpp
    fmt::fmt
    OpenSSL::SSL
    OpenSSL::Crypto
)

target_include_directories(integration_tests PRIVATE
    ${CMAKE_CURRENT_SOURCE_DIR}/../
)

# Add Google Test auto-discovery
include(GoogleTest)
gtest_discover_tests(unit_tests)
gtest_discover_tests(integration_tests)
```