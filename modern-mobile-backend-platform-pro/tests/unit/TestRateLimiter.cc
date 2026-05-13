```cpp
#include "src/utils/RateLimiter.h"
#include "src/utils/AppConfig.h" // To initialize config for rate limiting
#include <gtest/gtest.h>
#include <chrono>
#include <thread>
#include <string>

// Global environment for AppConfig (for RateLimiter to read settings)
struct RateLimiterTestEnvironment : public ::testing::Environment {
    void SetUp() override {
        std::filesystem::create_directories("config");
        std::ofstream("config/default.json") << R"({"rateLimit":{"enabled":true,"bucketCapacity":10,"bucketRefillRatePerSecond":2}})";
        utils::AppConfig::getInstance();
    }
    void TearDown() override {
        std::filesystem::remove_all("config");
    }
};

[[maybe_unused]] static ::testing::Environment* const limiter_env = ::testing::AddGlobalTestEnvironment(new RateLimiterTestEnvironment);

TEST(RateLimiterTest, InitialAllowance) {
    auto& limiter = utils::RateLimiter::getInstance();
    // Ensure the limiter is enabled and has capacity
    ASSERT_TRUE(limiter.isEnabled());

    std::string key = "client1";
    // First requests should pass up to bucket capacity
    for (int i = 0; i < 10; ++i) { // Capacity is 10
        ASSERT_TRUE(limiter.tryConsume(key)) << "Request " << i << " should be allowed initially.";
    }
    // Next request should be blocked
    ASSERT_FALSE(limiter.tryConsume(key));
}

TEST(RateLimiterTest, RefillTokens) {
    auto& limiter = utils::RateLimiter::getInstance();
    limiter.tryConsume("client2", 10); // Consume all tokens for client2

    // Wait for tokens to refill (rate is 2 tokens/sec, capacity 10)
    std::this_thread::sleep_for(std::chrono::seconds(1)); // Should refill 2 tokens
    ASSERT_TRUE(limiter.tryConsume("client2")); // Should pass (1 token used, 1 remaining)
    ASSERT_TRUE(limiter.tryConsume("client2")); // Should pass (0 token remaining)
    ASSERT_FALSE(limiter.tryConsume("client2")); // Should fail

    std::this_thread::sleep_for(std::chrono::seconds(4)); // Wait for full refill (8 more tokens needed, so 4 seconds)
    ASSERT_TRUE(limiter.tryConsume("client2", 10)); // Should pass again
}

TEST(RateLimiterTest, DisabledLimiter) {
    // Temporarily set rateLimit.enabled to false in config
    std::filesystem::create_directories("config/environments");
    std::ofstream("config/environments/test_no_ratelimit.json") << R"({"rateLimit":{"enabled":false}})";
    
    EnvVarGuard envGuard("APP_ENV", "test_no_ratelimit");

    // Re-initialize AppConfig (or restart test for singleton reload)
    // This is problematic for singleton. Re-instantiate the limiter with a fake config.
    // In a real test, either the app_env would be set before test run, or the limiter would be mockable.
    
    // For direct testing, construct a temporary AppConfig and then a temporary RateLimiter
    // This requires making AppConfig and RateLimiter constructors public for testing or providing a factory.
    // Given the constraints, we rely on the global AppConfig.
    // Assuming the global `limiter_env` sets up `AppConfig` *before* RateLimiter is first accessed:
    
    // The previous singleton `limiter` instance would still be active and its `enabled_` field set
    // according to the global env.
    // To test `disabled` specifically, we'd need to mock `AppConfig` or ensure its re-initialization.
    
    // For simplicity, we