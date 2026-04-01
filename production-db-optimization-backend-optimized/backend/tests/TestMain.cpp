```cpp
#define CATCH_CONFIG_MAIN // This tells Catch to provide a main() - only do this in one cpp file
#include <catch2/catch_all.hpp>
// Include other test files here for convenience or let CMake discover them

// Example setup/teardown for global resources (e.g., database)
struct GlobalFixture {
    GlobalFixture() {
        // Initialize logger for tests
        //Logger::init(); // Make sure this is safe for multiple calls or only called once

        // Setup a test database connection or mock it
        // For integration tests, connect to a dedicated test DB instance
        // For unit tests, ensure database calls are mocked or avoided
        std::cout << "Global Test Fixture Setup: Initializing test environment...\n";
    }

    ~GlobalFixture() {
        // Clean up test database or resources
        std::cout << "Global Test Fixture Teardown: Cleaning up test environment...\n";
    }
};

// This registers our fixture to run once for all tests
// In Catch2 v3, using TEST_CASE_METHOD for fixtures is more common.
// For global setup, a custom main or an event listener might be better.
// For simplicity, we assume individual tests handle their mocks or a dedicated test DB is running.
// You can use a session-level listener for global setup.
/*
class MyTestListener : public Catch::TestEventListenerBase {
public:
    using Catch::TestEventListenerBase::TestEventListenerBase;

    void sessionStarting(Catch::IMutableConfig const& config, Catch::ReporterDescriptions const& reporters) override {
        // Global setup logic here
        std::cout << "Test session starting, initializing global resources...\n";
        // e.g., Logger::init("test.log"); AppConfig::loadConfig("test.env"); Database::initPool(1);
    }

    void sessionEnded(Catch::SessionStats const& stats) override {
        // Global teardown logic here
        std::cout << "Test session ended, cleaning up global resources...\n";
    }
};

CATCH_REGISTER_LISTENER(MyTestListener)
*/

// Individual test files will be discovered by CMake's catch_discover_tests()
// Example: TestJsonUtils.cpp, TestAuthService.cpp
```