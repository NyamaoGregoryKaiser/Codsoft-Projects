```cpp
#include "src/utils/Cache.h"
#include "src/utils/AppConfig.h" // To initialize config for cache TTL
#include <gtest/gtest.h>
#include <chrono>
#include <thread>
#include <string>

// Global environment for AppConfig (for Cache to read TTL)
struct CacheTestEnvironment : public ::testing::Environment {
    void SetUp() override {
        std::filesystem::create_directories("config");
        std::ofstream("config/default.json") << R"({"cache":{"ttlSeconds":1}})"; // Default TTL to 1 second for tests
        utils::AppConfig::getInstance();
    }
    void TearDown() override {
        std::filesystem::remove_all("config");
    }
};

[[maybe_unused]] static ::testing::Environment* const cache_env = ::testing::AddGlobalTestEnvironment(new CacheTestEnvironment);


TEST(CacheTest, PutAndGet) {
    auto& cache = utils::Cache::getInstance();
    cache.clear(); // Ensure clean state

    std::string key = "testKey";
    std::string value = "testValue";

    cache.put(key, value, 5); // TTL of 5 seconds

    auto retrieved = cache.get(key);
    ASSERT_TRUE(retrieved.has_value());
    ASSERT_EQ(std::any_cast<std::string>(*retrieved), value);
}

TEST(CacheTest, GetNonExistentKey) {
    auto& cache = utils::Cache::getInstance();
    cache.clear();

    auto retrieved = cache.get("nonExistentKey");
    ASSERT_FALSE(retrieved.has_value());
}

TEST(CacheTest, ExpiredItem) {
    auto& cache = utils::Cache::getInstance();
    cache.clear();

    std::string key = "expiredKey";
    std::string value = "expiredValue";

    cache.put(key, value, 1); // TTL of 1 second

    std::this_thread::sleep_for(std::chrono::seconds(2)); // Wait for it to expire

    auto retrieved = cache.get(key);
    ASSERT_FALSE(retrieved.has_value()); // Should be expired and removed
    ASSERT_EQ(cache.size(), 0); // Should be removed from map
}

TEST(CacheTest, RemoveItem) {
    auto& cache = utils::Cache::getInstance();
    cache.clear();

    std::string key1 = "key1";
    std::string key2 = "key2";
    cache.put(key1, std::string("value1"), 5);
    cache.put(key2, std::string("value2"), 5);

    ASSERT_EQ(cache.size(), 2);
    cache.remove(key1);
    ASSERT_EQ(cache.size(), 1);
    ASSERT_FALSE(cache.get(key1).has_value());
    ASSERT_TRUE(cache.get(key2).has_value());
}

TEST(CacheTest, ClearCache) {
    auto& cache = utils::Cache::getInstance();
    cache.clear();

    cache.put("key1", std::string("value1"), 5);
    cache.put("key2", std::string("value2"), 5);

    ASSERT_EQ(cache.size(), 2);
    cache.clear();
    ASSERT_EQ(cache.size(), 0);
    ASSERT_FALSE(cache.get("key1").has_value());
}

TEST(CacheTest, DifferentDataTypes) {
    auto& cache = utils::Cache::getInstance();
    cache.clear();

    cache.put("int_key", 123, 5);
    cache.put("double_key", 45.67, 5);
    cache.put("bool_key", true, 5);

    ASSERT_EQ(std::any_cast<int>(*cache.get("int_key")), 123);
    ASSERT_DOUBLE_EQ(std::any_cast<double>(*cache.get("double_key")), 45.67);
    ASSERT_EQ(std::any_cast<bool>(*cache.get("bool_key")), true);
}

TEST(CacheTest, DefaultTTL) {
    auto& cache = utils::Cache::getInstance();
    cache.clear();

    // AppConfig is set to 1 second in CacheTestEnvironment
    cache.put("default_ttl_key", std::string("value"));
    ASSERT_EQ(cache.size(), 1);

    std::this_thread::sleep_for(std::chrono::seconds(2));
    ASSERT_FALSE(cache.get("default_ttl_key").has_value());
    ASSERT_EQ(cache.size(), 0);
}
```