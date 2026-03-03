```cpp
#include <gtest/gtest.h>
#include "src/utils/JwtManager.h"
#include "src/utils/Logger.h" // Include for proper compilation/logging setup
#include <vector>
#include <chrono>
#include <thread>

// JWT secret and expiration for testing
const std::string TEST_JWT_SECRET = "test_super_secret_jwt_key_1234567890";
const long TEST_ACCESS_TOKEN_EXPIRATION = 1; // 1 second for quick expiration testing
const long TEST_REFRESH_TOKEN_EXPIRATION = 10; // 10 seconds

// Initialize JWT Manager once for all tests
class JwtManagerTest : public ::testing::Test {
protected:
    static void SetUpTestSuite() {
        ApexContent::Utils::Logger::init(); // Ensure logger is initialized
        ApexContent::Utils::JwtManager::init(TEST_JWT_SECRET, TEST_ACCESS_TOKEN_EXPIRATION, TEST_REFRESH_TOKEN_EXPIRATION);
    }
};

TEST_F(JwtManagerTest, GenerateAndVerifyValidAccessToken) {
    int userId = 1;
    std::string username = "testuser";
    std::vector<std::string> roles = {"user", "editor"};

    auto [accessToken, refreshToken] = ApexContent::Utils::JwtManager::generateTokens(userId, username, roles);

    ASSERT_FALSE(accessToken.empty());
    ASSERT_FALSE(refreshToken.empty());

    auto claims = ApexContent::Utils::JwtManager::verifyAccessToken(accessToken);
    ASSERT_TRUE(claims.has_value());
    ASSERT_EQ(claims.value()["userId"].asInt(), userId);
    ASSERT_EQ(claims.value()["username"].asString(), username);
    ASSERT_TRUE(claims.value()["roles"].isArray());
    ASSERT_EQ(claims.value()["roles"].size(), 2);
    ASSERT_EQ(claims.value()["roles"][0].asString(), "user");
    ASSERT_EQ(claims.value()["roles"][1].asString(), "editor");
}

TEST_F(JwtManagerTest, VerifyExpiredAccessToken) {
    int userId = 2;
    std::string username = "expireduser";
    std::vector<std::string> roles = {"user"};

    auto [accessToken, refreshToken] = ApexContent::Utils::JwtManager::generateTokens(userId, username, roles);

    // Wait for the access token to expire (TEST_ACCESS_TOKEN_EXPIRATION = 1 second)
    std::this_thread::sleep_for(std::chrono::seconds(TEST_ACCESS_TOKEN_EXPIRATION + 1));

    auto claims = ApexContent::Utils::JwtManager::verifyAccessToken(accessToken);
    ASSERT_FALSE(claims.has_value()); // Should be expired
}

TEST_F(JwtManagerTest, VerifyInvalidSignatureAccessToken) {
    int userId = 3;
    std::string username = "invalidsiguser";
    std::vector<std::string> roles = {"user"};

    auto [accessToken, refreshToken] = ApexContent::Utils::JwtManager::generateTokens(userId, username, roles);

    // Tamper with the token (change a character in the payload)
    std::string tamperedToken = accessToken;
    size_t secondDot = tamperedToken.find('.', tamperedToken.find('.') + 1);
    ASSERT_NE(secondDot, std::string::npos);
    if (secondDot != std::string::npos) {
        tamperedToken[secondDot - 1] = (tamperedToken[secondDot - 1] == 'A' ? 'B' : 'A'); // Change a char in payload
    }

    auto claims = ApexContent::Utils::JwtManager::verifyAccessToken(tamperedToken);
    ASSERT_FALSE(claims.has_value()); // Should fail signature verification
}

TEST_F(JwtManagerTest, GenerateAndVerifyValidRefreshToken) {
    int userId = 4;
    std::string username = "refreshuser";
    std::vector<std::string> roles = {"user"};

    auto [accessToken, refreshToken] = ApexContent::Utils::JwtManager::generateTokens(userId, username, roles);
    ASSERT_FALSE(refreshToken.empty());

    auto claims = ApexContent::Utils::JwtManager::verifyRefreshToken(refreshToken);
    ASSERT_TRUE(claims.has_value());
    ASSERT_EQ(claims.value()["userId"].asInt(), userId);
}

TEST_F(JwtManagerTest, VerifyExpiredRefreshToken) {
    int userId = 5;
    std::string username = "expiredrefreshuser";
    std::vector<std::string> roles = {"user"};

    auto [accessToken, refreshToken] = ApexContent::Utils::JwtManager::generateTokens(userId, username, roles);

    // Wait for the refresh token to expire
    std::this_thread::sleep_for(std::chrono::seconds(TEST_REFRESH_TOKEN_EXPIRATION + 1));

    auto claims = ApexContent::Utils::JwtManager::verifyRefreshToken(refreshToken);
    ASSERT_FALSE(claims.has_value()); // Should be expired
}
```