#include <gtest/gtest.h>
#include "../../src/utils/PasswordHasher.h"
#include "../../src/utils/JWTManager.h"
#include "../../src/config/Config.h" // For JWT secrets
#include "../../src/models/User.h" // For UserRole
#include "../../src/logger/Logger.h" // For logger initialization

// Initialize logger once for all tests
struct GlobalTestEnvironment : public ::testing::Environment {
    void SetUp() override {
        Logger::init();
        // Set up minimal config for tests that need JWT secrets
        // Use dummy values, as we are not loading from .env for unit tests.
        // For production, these would be loaded from .env.
        // It's tricky to set statics in Config directly, usually tests mock or use temp .env
        // For simplicity, directly set environment variables for this test run.
#ifdef _WIN32
        _putenv_s("JWT_SECRET", "test_access_secret_123");
        _putenv_s("JWT_REFRESH_SECRET", "test_refresh_secret_456");
        _putenv_s("JWT_ACCESS_TOKEN_EXPIRATION_MINUTES", "1");
        _putenv_s("JWT_REFRESH_TOKEN_EXPIRATION_MINUTES", "10");
        _putenv_s("DB_HOST", "localhost");
        _putenv_s("DB_PORT", "5432");
        _putenv_s("DB_USER", "testuser");
        _putenv_s("DB_PASSWORD", "testpass");
        _putenv_s("DB_NAME", "testdb");
        _putenv_s("HTTP_PORT", "8080");
        _putenv_s("RATE_LIMIT_MAX_REQUESTS", "10");
        _putenv_s("RATE_LIMIT_WINDOW_SECONDS", "60");
#else
        setenv("JWT_SECRET", "test_access_secret_123", 1);
        setenv("JWT_REFRESH_SECRET", "test_refresh_secret_456", 1);
        setenv("JWT_ACCESS_TOKEN_EXPIRATION_MINUTES", "1", 1);
        setenv("JWT_REFRESH_TOKEN_EXPIRATION_MINUTES", "10", 1);
        setenv("DB_HOST", "localhost", 1);
        setenv("DB_PORT", "5432", 1);
        setenv("DB_USER", "testuser", 1);
        setenv("DB_PASSWORD", "testpass", 1);
        setenv("DB_NAME", "testdb", 1);
        setenv("HTTP_PORT", "8080", 1);
        setenv("RATE_LIMIT_MAX_REQUESTS", "10", 1);
        setenv("RATE_LIMIT_WINDOW_SECONDS", "60", 1);
#endif
        Config::load(".env.test"); // Try to load from a dummy test env file, will fallback to setenv if not found
    }
    void TearDown() override {
        // Clean up any resources if necessary
    }
};

[[maybe_unused]] testing::Environment* const env = testing::AddGlobalTestEnvironment(new GlobalTestEnvironment);


// --- PasswordHasher Tests ---
TEST(PasswordHasherTest, HashAndVerifyCorrectPassword) {
    std::string password = "mySecurePassword123";
    std::string hashedPassword = PasswordHasher::hashPassword(password);
    ASSERT_TRUE(PasswordHasher::verifyPassword(password, hashedPassword));
}

TEST(PasswordHasherTest, VerifyIncorrectPassword) {
    std::string password = "mySecurePassword123";
    std::string wrongPassword = "wrongPassword";
    std::string hashedPassword = PasswordHasher::hashPassword(password);
    ASSERT_FALSE(PasswordHasher::verifyPassword(wrongPassword, hashedPassword));
}

TEST(PasswordHasherTest, VerifyEmptyPassword) {
    std::string password = "";
    std::string hashedPassword = PasswordHasher::hashPassword(password);
    ASSERT_TRUE(PasswordHasher::verifyPassword(password, hashedPassword)); // Empty password can be hashed and verified
}

TEST(PasswordHasherTest, VerifyAgainstInvalidHashFormat) {
    std::string password = "testPassword";
    std::string invalidHash = "not_a_valid_hash_format";
    ASSERT_FALSE(PasswordHasher::verifyPassword(password, invalidHash));
}

TEST(PasswordHasherTest, HashesAreDifferentForSamePassword) {
    std::string password = "anotherSecurePassword";
    std::string hashedPassword1 = PasswordHasher::hashPassword(password);
    std::string hashedPassword2 = PasswordHasher::hashPassword(password);
    ASSERT_NE(hashedPassword1, hashedPassword2); // Due to salting, hashes should be different
    ASSERT_TRUE(PasswordHasher::verifyPassword(password, hashedPassword1));
    ASSERT_TRUE(PasswordHasher::verifyPassword(password, hashedPassword2));
}

// --- JWTManager Tests ---
TEST(JWTManagerTest, GenerateAndVerifyAccessToken) {
    int userId = 1;
    std::string username = "testuser";
    UserRole role = UserRole::USER;

    std::string accessToken = JWTManager::generateAccessToken(userId, username, role);
    ASSERT_FALSE(accessToken.empty());

    // Verify token using the access secret
    ASSERT_TRUE(JWTManager::verifyToken(accessToken, Config::getJwtSecret()));

    // Decode and check claims
    std::optional<TokenClaims> claims = JWTManager::decodeToken(accessToken, Config::getJwtSecret());
    ASSERT_TRUE(claims.has_value());
    ASSERT_EQ(claims->userId, userId);
    ASSERT_EQ(claims->username, username);
    ASSERT_EQ(claims->role, role);
    ASSERT_EQ(claims->tokenType, "access");
}

TEST(JWTManagerTest, GenerateAndVerifyRefreshToken) {
    int userId = 2;
    std::string username = "refreshuser";
    UserRole role = UserRole::ADMIN;

    std::string refreshToken = JWTManager::generateRefreshToken(userId, username, role);
    ASSERT_FALSE(refreshToken.empty());

    // Verify token using the refresh secret
    ASSERT_TRUE(JWTManager::verifyToken(refreshToken, Config::getJwtRefreshSecret()));

    // Decode and check claims
    std::optional<TokenClaims> claims = JWTManager::decodeToken(refreshToken, Config::getJwtRefreshSecret());
    ASSERT_TRUE(claims.has_value());
    ASSERT_EQ(claims->userId, userId);
    ASSERT_EQ(claims->username, username);
    ASSERT_EQ(claims->role, role);
    ASSERT_EQ(claims->tokenType, "refresh");
}

TEST(JWTManagerTest, VerifyTokenWithWrongSecret) {
    int userId = 3;
    std::string username = "secretuser";
    UserRole role = UserRole::USER;

    std::string accessToken = JWTManager::generateAccessToken(userId, username, role);
    
    // Verify with refresh secret (wrong secret for access token)
    ASSERT_FALSE(JWTManager::verifyToken(accessToken, Config::getJwtRefreshSecret()));
}

TEST(JWTManagerTest, DecodeTokenWithWrongSecret) {
    int userId = 4;
    std::string username = "decodeuser";
    UserRole role = UserRole::USER;

    std::string accessToken = JWTManager::generateAccessToken(userId, username, role);
    
    // Decode with wrong secret should fail
    std::optional<TokenClaims> claims = JWTManager::decodeToken(accessToken, Config::getJwtRefreshSecret());
    ASSERT_FALSE(claims.has_value());
}

TEST(JWTManagerTest, DecodeExpiredToken) {
    // For this test, we temporarily set a very short expiration
    // This requires re-initializing Config or using a dedicated test method.
    // For simplicity, we'll rely on the default 1 minute set in GlobalTestEnvironment.
    int userId = 5;
    std::string username = "expireuser";
    UserRole role = UserRole::USER;

    std::string accessToken = JWTManager::generateAccessToken(userId, username, role);
    
    // Wait for the token to expire (1 minute + buffer)
    std::this_thread::sleep_for(std::chrono::seconds(Config::getJwtAccessExpirationMinutes() * 60 + 5)); // Wait 1 min 5 sec

    // Verify should fail
    ASSERT_FALSE(JWTManager::verifyToken(accessToken, Config::getJwtSecret()));
    // Decode should also fail (or return std::nullopt)
    ASSERT_FALSE(JWTManager::decodeToken(accessToken, Config::getJwtSecret()).has_value());
}

TEST(JWTManagerTest, DecodeRefreshTokenForAccessTokenSecret) {
    int userId = 6;
    std::string username = "crosscheckuser";
    UserRole role = UserRole::USER;

    std::string refreshToken = JWTManager::generateRefreshToken(userId, username, role);
    
    // Attempt to decode refresh token using access token secret
    std::optional<TokenClaims> claims = JWTManager::decodeToken(refreshToken, Config::getJwtSecret());
    ASSERT_FALSE(claims.has_value()); // Should fail as secrets are different
}