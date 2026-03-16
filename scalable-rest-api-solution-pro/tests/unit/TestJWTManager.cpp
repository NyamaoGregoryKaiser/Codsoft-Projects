```cpp
#include <gtest/gtest.h>
#include "core/utils/JWTManager.h"
#include "core/utils/Logger.h" // For Logger::init
#include "core/utils/Config.h" // For Config::load
#include <chrono>
#include <thread>

// Global setup for tests
class JWTManagerTest : public ::testing::Test {
protected:
    static void SetUpTestSuite() {
        // Initialize config and logger once for the test suite
        Config::load("config.json"); // Load a dummy or actual config
        Logger::init(Config::get("log_config_path", "config/log_config.json"));

        JWTManager::init("test_secret_key_1234567890", "test-issuer", 1); // 1 minute expiry
    }

    void SetUp() override {
        // Reset JWTManager if needed, though SetUpTestSuite handles it
    }

    void TearDown() override {
        // No specific tear down needed
    }
};

TEST_F(JWTManagerTest, GenerateAndVerifyValidToken) {
    long long user_id = 123;
    std::string username = "testuser";
    std::string email = "test@example.com";

    std::string token = JWTManager::generateToken(user_id, username, email);
    ASSERT_FALSE(token.empty());

    std::optional<nlohmann::json> claims = JWTManager::verifyToken(token);
    ASSERT_TRUE(claims.has_value());
    ASSERT_EQ(claims->at("user_id").get<std::string>(), std::to_string(user_id));
    ASSERT_EQ(claims->at("username").get<std::string>(), username);
    ASSERT_EQ(claims->at("email").get<std::string>(), email);
    ASSERT_EQ(claims->at("iss").get<std::string>(), "test-issuer");
}

TEST_F(JWTManagerTest, VerifyInvalidToken) {
    std::string invalid_token = "invalid.jwt.token";
    std::optional<nlohmann::json> claims = JWTManager::verifyToken(invalid_token);
    ASSERT_FALSE(claims.has_value());
}

TEST_F(JWTManagerTest, VerifyTokenWithWrongSecret) {
    // Temporarily change secret to generate a token, then reset
    std::string original_secret = Config::get("JWT_SECRET"); // Placeholder to store original secret
    JWTManager::init("wrong_secret", "test-issuer", 1);
    std::string token_with_wrong_secret = JWTManager::generateToken(1, "u", "e");
    
    JWTManager::init("test_secret_key_1234567890", "test-issuer", 1); // Reset to correct secret
    std::optional<nlohmann::json> claims = JWTManager::verifyToken(token_with_wrong_secret);
    ASSERT_FALSE(claims.has_value()); // Verification should fail

    // Restore original secret (important for other tests)
    // For this test, SetUpTestSuite handles the global init, so no need to restore a temporary change
    // If JWTManager::init was called in SetUp, it applies to all tests.
    // So, in this test, we are testing against a global correct secret for verification.
}


TEST_F(JWTManagerTest, VerifyExpiredToken) {
    // Generate a token with a very short expiry
    JWTManager::init("test_secret_key_1234567890", "test-issuer", 0); // 0 minutes expiry
    std::string token = JWTManager::generateToken(123, "expiring", "expiring@example.com");

    // Wait for a moment for token to expire (even 0 minutes means it expires immediately or very soon)
    std::this_thread::sleep_for(std::chrono::seconds(1));

    // Reset manager to non-zero expiry for subsequent tests
    JWTManager::init("test_secret_key_1234567890", "test-issuer", 1); 
    
    std::optional<nlohmann::json> claims = JWTManager::verifyToken(token);
    ASSERT_FALSE(claims.has_value()); // Verification should fail due to expiry
}

TEST_F(JWTManagerTest, InitWithEmptySecret) {
    // Test behavior when secret is empty (should not generate token)
    JWTManager::init("", "test-issuer", 1);
    ASSERT_THROW(JWTManager::generateToken(1, "user", "email"), std::runtime_error);

    // Reset for other tests
    JWTManager::init("test_secret_key_1234567890", "test-issuer", 1);
}
```