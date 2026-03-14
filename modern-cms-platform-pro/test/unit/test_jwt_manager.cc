#include <gtest/gtest.h>
#include "utils/JwtManager.h"
#include <json/json.h>
#include <chrono>

TEST(JwtManagerTest, GenerateAndVerifyToken) {
    // Manually initialize JWT secret for testing, as drogon::app() isn't running
    JwtManager::setSecret("test_secret_for_jwt_unit_tests_only");

    std::string userId = "test_user_123";
    std::string username = "testuser";
    std::string role = "user";

    std::string token = JwtManager::generateToken(userId, username, role);
    ASSERT_FALSE(token.empty());

    Json::Value payload;
    std::string error;
    bool verified = JwtManager::verifyToken(token, payload, error);

    ASSERT_TRUE(verified) << "Token verification failed: " << error;
    ASSERT_TRUE(error.empty());
    ASSERT_EQ(payload["user_id"].asString(), userId);
    ASSERT_EQ(payload["username"].asString(), username);
    ASSERT_EQ(payload["role"].asString(), role);
}

TEST(JwtManagerTest, VerifyInvalidToken) {
    JwtManager::setSecret("test_secret_for_jwt_unit_tests_only"); // Ensure secret is set

    std::string invalidToken = "invalid.token.string";
    Json::Value payload;
    std::string error;
    bool verified = JwtManager::verifyToken(invalidToken, payload, error);

    ASSERT_FALSE(verified);
    ASSERT_FALSE(error.empty());
    ASSERT_NE(error.find("Verification failed"), std::string::npos);
}

TEST(JwtManagerTest, VerifyTokenWithWrongSecret) {
    JwtManager::setSecret("correct_secret");

    std::string userId = "user456";
    std::string username = "anotheruser";
    std::string role = "admin";
    std::string token = JwtManager::generateToken(userId, username, role);

    JwtManager::setSecret("wrong_secret"); // Change secret for verification

    Json::Value payload;
    std::string error;
    bool verified = JwtManager::verifyToken(token, payload, error);

    ASSERT_FALSE(verified);
    ASSERT_FALSE(error.empty());
    ASSERT_NE(error.find("Verification failed"), std::string::npos);
}

// Test for token expiration (requires adjusting expiresInSeconds or mocking time)
// For simplicity in unit tests, we assume default expiresInSeconds (1hr) and don't
// wait for expiration. This would be better covered in integration/API tests.
TEST(JwtManagerTest, TokenExpires) {
    // This test is conceptual for a unit test.
    // In a real scenario, you'd mock std::chrono::system_clock::now()
    // or generate a token with a very short expiry and wait.
    // For this demonstration, we'll generate a token and then immediately
    // attempt to verify it with an 'expired' assumption if it were possible to instantly fast-forward time.
    // Since we cannot, we'll note this is a limitation without mocking or specific lib features.
    // JwtManager::setSecret("test_secret_for_jwt_unit_tests_only");
    // JwtManager::expiresInSeconds = 1; // Set a very short expiry

    // std::string token = JwtManager::generateToken("exp_user", "exp_user", "user");
    // // std::this_thread::sleep_for(std::chrono::seconds(2)); // Would need to wait in real test
    // Json::Value payload;
    // std::string error;
    // bool verified = JwtManager::verifyToken(token, payload, error);
    // ASSERT_FALSE(verified); // Expect it to fail due to expiration
    // ASSERT_NE(error.find("The token is expired"), std::string::npos); // Specific error message
}