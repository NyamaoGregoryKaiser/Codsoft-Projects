```cpp
#include <gtest/gtest.h>
#include "../auth/AuthService.h"
#include "../config/Config.h"
#include "../database/Database.h"
#include "../models/User.h" // For User::generateUuid

// Mock database for AuthService tests if needed, or use a real in-memory SQLite for simplicity
// For AuthService itself, DB is not strictly needed for hashing/JWT, but if it needs to check users, it would.
// We'll pass a dummy DB connection for now.

class AuthServiceTest : public ::testing::Test {
protected:
    std::shared_ptr<Database> mock_db;
    std::unique_ptr<AuthService> authService;

    void SetUp() override {
        // Use an in-memory database for testing
        mock_db = std::make_shared<Database>(":memory:");
        mock_db->open();
        authService = std::make_unique<AuthService>(mock_db);
    }

    void TearDown() override {
        authService.reset();
        mock_db->close();
    }
};

TEST_F(AuthServiceTest, HashPasswordAndVerifySuccess) {
    std::string password = "TestPassword123!";
    std::string hashedPassword = authService->hashPassword(password);
    ASSERT_FALSE(hashedPassword.empty());
    ASSERT_TRUE(authService->verifyPassword(password, hashedPassword));
}

TEST_F(AuthServiceTest, HashPasswordAndVerifyFailure) {
    std::string password = "TestPassword123!";
    std::string wrongPassword = "WrongPassword123!";
    std::string hashedPassword = authService->hashPassword(password);
    ASSERT_FALSE(hashedPassword.empty());
    ASSERT_FALSE(authService->verifyPassword(wrongPassword, hashedPassword));
}

TEST_F(AuthServiceTest, HashPasswordEmptyPassword) {
    std::string emptyPassword = "";
    ASSERT_THROW(authService->hashPassword(emptyPassword), AuthException);
}

TEST_F(AuthServiceTest, GenerateAndVerifyAccessToken) {
    std::string userId = User::generateUuid();
    std::string email = "test@example.com";

    TokenPair tokens = authService->generateTokens(userId, email);
    
    ASSERT_FALSE(tokens.accessToken.empty());
    ASSERT_FALSE(tokens.refreshToken.empty());
    ASSERT_GT(tokens.expiresIn, 0);

    auto decoded_jwt_opt = authService->verifyAccessToken(tokens.accessToken);
    ASSERT_TRUE(decoded_jwt_opt.has_value());
    auto decoded_jwt = decoded_jwt_opt.value();
    ASSERT_EQ(decoded_jwt.get_subject(), userId);
    ASSERT_EQ(decoded_jwt.get_payload_claim("email").as_string(), email);
    // Should not have 'token_type' for access tokens
    ASSERT_FALSE(decoded_jwt.has_payload_claim("token_type"));
}

TEST_F(AuthServiceTest, GenerateAndVerifyRefreshToken) {
    std::string userId = User::generateUuid();
    std::string email = "test@example.com";

    TokenPair tokens = authService->generateTokens(userId, email);
    
    auto decoded_jwt_opt = authService->verifyRefreshToken(tokens.refreshToken);
    ASSERT_TRUE(decoded_jwt_opt.has_value());
    auto decoded_jwt = decoded_jwt_opt.value();
    ASSERT_EQ(decoded_jwt.get_subject(), userId);
    ASSERT_EQ(decoded_jwt.get_payload_claim("email").as_string(), email);
    // Should have 'token_type' for refresh tokens
    ASSERT_TRUE(decoded_jwt.has_payload_claim("token_type"));
    ASSERT_EQ(decoded_jwt.get_payload_claim("token_type").as_string(), "refresh");
}

TEST_F(AuthServiceTest, VerifyInvalidToken) {
    std::string invalidToken = "invalid.jwt.token";
    auto decoded_jwt_opt = authService->verifyAccessToken(invalidToken);
    ASSERT_FALSE(decoded_jwt_opt.has_value());
}

TEST_F(AuthServiceTest, VerifyExpiredAccessToken) {
    // Temporarily set a very short expiration for testing
    int original_access_token_exp = Config::getJwtAccessTokenExpirationSeconds();
    Config::configMap["JWT_ACCESS_TOKEN_EXPIRATION_SECONDS"] = "1"; // 1 second

    AuthService shortLivedAuthService(mock_db); // Reinitialize to pick up new config

    std::string userId = User::generateUuid();
    std::string email = "expire@example.com";
    TokenPair tokens = shortLivedAuthService.generateTokens(userId, email);

    // Wait for token to expire (more than 1 second)
    std::this_thread::sleep_for(std::chrono::seconds(2));

    auto decoded_jwt_opt = shortLivedAuthService.verifyAccessToken(tokens.accessToken);
    ASSERT_FALSE(decoded_jwt_opt.has_value());

    // Restore original config
    Config::configMap["JWT_ACCESS_TOKEN_EXPIRATION_SECONDS"] = std::to_string(original_access_token_exp);
}

TEST_F(AuthServiceTest, AccessTokenUsedAsRefreshToken) {
    std::string userId = User::generateUuid();
    std::string email = "access@example.com";
    TokenPair tokens = authService->generateTokens(userId, email);

    // Try to verify access token as a refresh token
    auto decoded_jwt_opt = authService->verifyRefreshToken(tokens.accessToken);
    ASSERT_FALSE(decoded_jwt_opt.has_value()); // Should fail because of missing 'token_type'
}

TEST_F(AuthServiceTest, RefreshTokenUsedAsAccessToken) {
    std::string userId = User::generateUuid();
    std::string email = "refresh@example.com";
    TokenPair tokens = authService->generateTokens(userId, email);

    // Try to verify refresh token as an access token
    auto decoded_jwt_opt = authService->verifyAccessToken(tokens.refreshToken);
    ASSERT_FALSE(decoded_jwt_opt.has_value()); // Should fail because of 'token_type' mismatch
}
```