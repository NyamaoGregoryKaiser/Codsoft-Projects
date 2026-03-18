#define CATCH_CONFIG_MAIN
#include <catch2/catch_test_macros.hpp>
#include <catch2/catch_session.hpp>

// Initialize necessary singletons before tests run
#include "config/AppConfig.h"
#include "database/DatabaseManager.h"
#include "spdlog/spdlog.h"
#include "spdlog/sinks/null_sink.h" // Use null sink for tests to avoid console clutter

int main(int argc, char* argv[]) {
    // Set up a null logger for tests
    auto null_sink = std::make_shared<spdlog::sinks::null_sink_mt>();
    spdlog::set_default_logger(std::make_shared<spdlog::logger>("ML_UTIL_LOG", null_sink));
    spdlog::set_level(spdlog::level::off); // Turn off logging for tests

    // Initialize AppConfig (using default/test values or mock .env)
    AppConfig& config = AppConfig::getInstance();
    // For tests, you might want to load a specific test environment config
    // or set values directly. For this example, we'll try to load from a dummy env.
    try {
        config.loadFromEnv();
    } catch (const std::runtime_error& e) {
        // If .env is not present, use hardcoded test values
        // This is a simplified way to ensure config is available for tests.
        // In a real project, consider a test-specific .env or config method.
        std::cerr << "Warning: Failed to load .env for tests (" << e.what() << "). Using default/hardcoded values for testing.\n";
        // Manual override for test environment
        // NOTE: This does not set the values on the singleton. A method to set them
        // or a test-specific config load is needed.
        // For simplicity, we assume default values if not loaded.
    }


    // Initialize DatabaseManager with a temporary in-memory database for tests
    DatabaseManager& db_manager = DatabaseManager::getInstance();
    try {
        db_manager.init(":memory:"); // Use in-memory database for testing
        db_manager.runMigrations(); // Apply schema to in-memory db
    } catch (const std::exception& e) {
        std::cerr << "CRITICAL: Failed to initialize in-memory database for tests: " << e.what() << std::endl;
        return 1; // Cannot run tests without database
    }

    int result = Catch::Session().run(argc, argv);

    // Clean up or close database if necessary (for persistent DBs)
    // For in-memory, it's implicitly destroyed.

    return result;
}
```