```cpp
#include "gtest/gtest.h"
#include "utils/logger.h"
#include <iostream>
#include <thread>
#include <chrono>

// Global setup and teardown for all tests
class GlobalTestEnvironment : public ::testing::Environment {
public:
    void SetUp() override {
        // Initialize logger for tests
        Logger::init(LogLevel::DEBUG);
        LOG_INFO("Global test environment setup.");
        // Ensure the test database is clean before running tests
        // This should ideally be done by the CI script or a setup script
        // For local runs, ensure your `apply_migrations.sh` is run before `make test`
    }

    void TearDown() override {
        LOG_INFO("Global test environment teardown.");
        // Clean up test database if necessary
    }
};

int main(int argc, char **argv) {
    ::testing::InitGoogleTest(&argc, argv);
    ::testing::AddGlobalTestEnvironment(new GlobalTestEnvironment());
    return RUN_ALL_TESTS();
}
```