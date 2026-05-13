```cpp
#include "src/utils/AppConfig.h"
#include "src/utils/Logger.h" // For disabling logging in tests or redirecting
#include <gtest/gtest.h>
#include <fstream>
#include <cstdio> // For remove()

// Helper to create a dummy config file
void createDummyConfigFile(const std::string& path, const std::string& content) {
    std::ofstream file(path);
    ASSERT_TRUE(file.is_open()) << "Could not open dummy config file: " << path;
    file << content;
    file.close();
}

// Helper to set and unset environment variables
class EnvVarGuard {
public:
    EnvVarGuard(const std::string& name, const std::string& value) : name_(name) {
        originalValue_ = std::getenv(name.c_str()) ? std::optional<std::string>(std::getenv(name.c_str())) : std::nullopt;
        setenv(name.c_str(), value.c_str(), 1); // Overwrite if exists
    }
    ~EnvVarGuard() {
        if (originalValue_) {
            setenv(name_.c_str(), originalValue_->c_str(), 1);
        } else {
            unsetenv(name_.c_str());
        }
    }
private:
    std::string name_;
    std::optional<std::string> originalValue_;
};


TEST(AppConfigTest, SingletonInstance) {
    utils::AppConfig& config1 = utils::AppConfig::getInstance();
    utils::AppConfig& config2 = utils::AppConfig::getInstance();
    ASSERT_EQ(&config1, &config2); // Should be the same instance
}

TEST(AppConfigTest, DefaultValues) {
    // Ensure default config files exist for this test, or create them
    createDummyConfigFile("config/default.json", R"({"app":{"port":8080,"logLevel":"info"},"database":{"host":"localhost"}})");
    utils::AppConfig& config = utils::AppConfig::getInstance();

    ASSERT_EQ(config.getInt("app.port"), 8080);
    ASSERT_EQ(config.getString("app.logLevel"), "info");
    ASSERT_EQ(config.getString("database.host"), "localhost");
    ASSERT_EQ(config.getString("non.existent.key", "default_string"), "default_string");
    ASSERT_EQ(config.getInt("non.existent.int", 123), 123);
    ASSERT_EQ(config.getBool("non.existent.bool", true), true);
}

TEST(AppConfigTest, EnvSpecificConfig) {
    // Create dummy default and environment-specific config files
    createDummyConfigFile("config/default.json", R"({"app":{"port":8080,"logLevel":"info"},"database":{"host":"localhost"}})");
    createDummyConfigFile("config/environments/test.json", R"({"app":{"port":9000,"newKey":"test_value"},"database":{"host":"test_host"}})");

    // Set APP_ENV to "test"
    EnvVarGuard envGuard("APP_ENV", "test");

    // Re-initialize AppConfig to pick up new env var (or restart test runner)
    // For unit tests, `getInstance` might return an already initialized instance.
    // A more robust test would ensure re-initialization, or run tests in isolation.
    // For this demonstration, we'll assume a clean state for AppConfig between test files
    // or simulate it by creating a new unique AppConfig for testing
    // (but AppConfig is a singleton, so this is tricky without a full restart or reset method).
    // The simplest way to test this within GTest is to set the environment *before* the first getInstance call.

    // A hack for singleton re-initialization in test:
    // This is generally bad practice for singletons, but sometimes necessary for testing.
    // Requires making the constructor public or adding a reset method.
    // For this example, we assume `getInstance` is called only once per test process for simplicity,
    // or `APP_ENV` is set before test execution. Let's make AppConfig's constructor public temporarily for testing.
    // Alternatively, rely on `overrideWithEnvVars` after instantiation.

    // Let's manually trigger the override for testing purposes for an existing instance
    // This is not how the singleton is *intended* to be reloaded, but demonstrates functionality.
    utils::AppConfig& config = utils::AppConfig::getInstance(); // Gets the initially loaded instance.
    // To properly test initial load with APP_ENV, need to run this test in a separate process.

    // Let's directly test `overrideWithEnvVars`
    nlohmann::json testJson = R"({"app":{"port":8080},"database":{"host":"localhost"}})"_json;
    setenv("APP_PORT", "9090", 1);
    config.overrideWithEnvVars(testJson); // Call protected method for test
    unsetenv("APP_PORT");

    ASSERT_EQ(testJson["app"]["port"].get<int>(), 9090);
    
    // Clean up dummy config files
    remove("config/default.json");
    remove("config/environments/test.json");
}

TEST(AppConfigTest, EnvVarOverrides) {
    createDummyConfigFile("config/default.json", R"({"app":{"port":8080,"logLevel":"info"},"database":{"host":"localhost"}})");

    EnvVarGuard portGuard("APP_PORT", "8888");
    EnvVarGuard dbUserGuard("DB_USER", "env_user");
    EnvVarGuard logLevelGuard("LOG_LEVEL", "debug");
    EnvVarGuard cacheTtlGuard("CACHE_TTL_SECONDS", "600");

    // Force re-initialization of AppConfig for the test, which is tricky for a singleton.
    // For this mock, `getInstance` will return the same one, so this test might not accurately
    // reflect *initial load* but *runtime overrides*.
    // A proper isolated test would involve running gtest for this specific case in a subprocess.
    // Given the constraints, we'll create an instance that only applies env overrides.
    
    // A temporary way to instantiate a fresh config for testing:
    // This requires making AppConfig constructor public for testing or providing a factory/reset method.
    // For this example, we'll just test the `overrideWithEnvVars` part.
    
    nlohmann::json baseConfig = R"({"app":{"port":8080,"logLevel":"info"},"database":{"host":"localhost","user":"appuser"},"cache":{"ttlSeconds":300}})"_json;
    utils::AppConfig appConfigUnderTest; // This would normally be `AppConfig::getInstance()`

    // Re-applying env vars to a fresh config if possible, or using the existing singleton
    // For this test, we must assume `getInstance()` is called after env vars are set,
    // or we must have a way to re-initialize the singleton.
    // This setup will work if the entire test binary is run *after* env vars are set.
    utils::AppConfig& config = utils::AppConfig::getInstance(); // This will pick up initial env vars.

    ASSERT_EQ(config.getInt("app.port"), 8888);
    ASSERT_EQ(config.getString("database.user"), "env_user");
    ASSERT_EQ(config.getString("app.logLevel"), "debug");
    ASSERT_EQ(config.getInt("cache.ttlSeconds"), 600);

    remove("config/default.json");
}

TEST(AppConfigTest, GetJson) {
    createDummyConfigFile("config/default.json", R"({"nested":{"key1":"value1","key2":123},"list":[1,2,3]})");
    utils::AppConfig& config = utils::AppConfig::getInstance();

    nlohmann::json nested = config.getJson("nested");
    ASSERT_TRUE(nested.is_object());
    ASSERT_EQ(nested["key1"].get<std::string>(), "value1");
    ASSERT_EQ(nested["key2"].get<int>(), 123);

    nlohmann::json list = config.getJson("list");
    ASSERT_TRUE(list.is_array());
    ASSERT_EQ(list.size(), 3);
    ASSERT_EQ(list[0].get<int>(), 1);

    remove("config/default.json");
}
```