```cpp
#include <gtest/gtest.h>
#include "../config/Config.h"
#include "../utils/Logger.h"

// Custom test listener to integrate with Logger
class GTestLogger : public ::testing::EmptyTestEventListener {
public:
    void OnTestStart(const ::testing::TestInfo& test_info) override {
        Logger::setLogLevel(WARN); // Set to WARN to minimize test output
        LOG_INFO("Running test: %s.%s", test_info.test_suite_name(), test_info.name());
    }

    void OnTestEnd(const ::testing::TestInfo& test_info) override {
        LOG_INFO("Finished test: %s.%s - %s", test_info.test_suite_name(), test_info.name(),
                 test_info.result()->Passed() ? "PASSED" : "FAILED");
    }
};

int main(int argc, char **argv) {
    // Initialize Google Test
    ::testing::InitGoogleTest(&argc, argv);

    // Initialize application configuration for tests
    Config::loadConfig(".env.example"); // Use example .env for tests

    // Add our custom listener
    ::testing::TestEventListeners& listeners = ::testing::UnitTest::GetInstance()->listeners();
    listeners.Release(listeners.default_for_xml_output()); // Optional: if you don't want default XML listener
    listeners.Append(new GTestLogger());

    return RUN_ALL_TESTS();
}
```