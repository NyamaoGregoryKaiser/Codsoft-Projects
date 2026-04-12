```cpp
#include <gtest/gtest.h>
#include "../../src/config/ConfigManager.h"
#include "../../src/utils/Logger.h"
#include <fstream>
#include <filesystem>

// Dummy .env file content for testing
const std::string TEST_ENV_CONTENT = R"(
# This is a test .env file
TEST_STRING=hello_world
TEST_INT=123
TEST_BOOL_TRUE=true
TEST_BOOL_ONE=1
TEST_BOOL_FALSE=false
TEST_BOOL_ZERO=0
EMPTY_KEY=
DATABASE_URL=test_db_url
# Comment line
  KEY_WITH_SPACES =   value_with_spaces  
)";

// Create a temporary .env file for tests
void createTestEnvFile(const std::string& path, const std::string& content) {
    std::ofstream ofs(path);
    ofs << content;
    ofs.close();
}

TEST(ConfigManagerTest, LoadConfigSuccessfully) {
    Scraper::Utils::Logger::init("test_logger", "/dev/null"); // Suppress console output for tests
    std::string test_env_path = "test_config/.env";
    std::filesystem::create_directories("test_config");
    createTestEnvFile(test_env_path, TEST_ENV_CONTENT);

    Scraper::Config::ConfigManager& config = Scraper::Config::ConfigManager::getInstance();
    
    // Test if loading without exception
    ASSERT_NO_THROW(config.loadConfig(test_env_path));

    // Test string values
    ASSERT_EQ(config.getString("TEST_STRING"), "hello_world");
    ASSERT_EQ(config.getString("DATABASE_URL"), "test_db_url");
    ASSERT_EQ(config.getString("KEY_WITH_SPACES"), "value_with_spaces");
    ASSERT_EQ(config.getString("EMPTY_KEY"), "");
    ASSERT_EQ(config.getString("NON_EXISTENT_KEY", "default"), "default");

    // Test int values
    ASSERT_EQ(config.getInt("TEST_INT"), 123);
    ASSERT_EQ(config.getInt("NON_EXISTENT_INT", 456), 456);
    ASSERT_EQ(config.getInt("TEST_STRING", 0), 0); // Should return default if not an int

    // Test bool values
    ASSERT_TRUE(config.getBool("TEST_BOOL_TRUE"));
    ASSERT_TRUE(config.getBool("TEST_BOOL_ONE"));
    ASSERT_FALSE(config.getBool("TEST_BOOL_FALSE"));
    ASSERT_FALSE(config.getBool("TEST_BOOL_ZERO"));
    ASSERT_FALSE(config.getBool("NON_EXISTENT_BOOL", false));
    ASSERT_TRUE(config.getBool("NON_EXISTENT_BOOL", true));

    std::filesystem::remove_all("test_config");
}

TEST(ConfigManagerTest, LoadNonExistentConfig) {
    Scraper::Utils::Logger::init("test_logger", "/dev/null");
    Scraper::Config::ConfigManager& config = Scraper::Config::ConfigManager::getInstance();
    
    // Expect an exception if config file doesn't exist
    ASSERT_THROW(config.loadConfig("non_existent_dir/non_existent.env"), std::runtime_error);
}

// Ensure subsequent loads use the same instance but can reload
TEST(ConfigManagerTest, SingletonBehaviorAndReload) {
    Scraper::Utils::Logger::init("test_logger", "/dev/null");
    std::string test_env_path = "test_config/.env";
    std::filesystem::create_directories("test_config");
    createTestEnvFile(test_env_path, "KEY=initial_value");

    Scraper::Config::ConfigManager& config1 = Scraper::Config::ConfigManager::getInstance();
    config1.loadConfig(test_env_path);
    ASSERT_EQ(config1.getString("KEY"), "initial_value");

    createTestEnvFile(test_env_path, "KEY=updated_value"); // Change content
    Scraper::Config::ConfigManager& config2 = Scraper::Config::ConfigManager::getInstance();
    config2.loadConfig(test_env_path); // Reload

    ASSERT_EQ(config2.getString("KEY"), "updated_value");
    ASSERT_EQ(&config1, &config2); // Verify it's the same instance

    std::filesystem::remove_all("test_config");
}
```