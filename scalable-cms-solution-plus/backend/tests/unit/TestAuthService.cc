#include <gtest/gtest.h>
#include "services/AuthService.h"
#include "services/TokenService.h"
#include "database/DbClientManager.h"
#include "config/AppConfig.h"
#include "utils/PasswordHasher.h"
#include "utils/Logger.h" // For initialization

#include <drogon/orm/Mapper.h>
#include <drogon/orm/Criteria.h>
#include "models/User.h" // Generated User model

// Mock or configure Drogon and Database for testing
// This is a simplified approach. For real integration tests, a test DB should be used.

// Global setup for tests
class AuthServiceTestFixture : public ::testing::Test {
protected:
    static void SetUpTestSuite() {
        // Load test configuration
        AppConfig::loadConfig("../config/test.json", true); // Create a test.json for tests
        // Initialize logger for tests
        Logger::initialize("logs/test_cms_backend.log", spdlog::level::debug);
        LOG_INFO("AuthServiceTestFixture: Setting up test suite...");

        // Initialize Drogon's app and DB client without starting HTTP server
        // This is tricky as drogon::app().run() is usually required for full setup.
        // For unit tests, we'll try to manually initialize components or mock them.
        // For actual integration tests, you'd launch a separate Drogon instance or use a test framework.
        
        // Manual initialization of internal drogons components necessary for Mapper.
        drogon::app().loadConfig("../config/test.json");
        drogon::app().enableRuningStaticFiles(false); // Disable file serving
        drogon::app().setThreadNum(1); // Minimal threads for testing
        // You generally don't call run() for unit tests.
        // If DrogonDbException occurs due to uninitialized framework,
        // it means we need to ensure drogons internal state is ready for ORM usage.
        
        // This is a workaround for tests that need a DbClient but not the full app running.
        // In a real scenario, you'd mock the DbClient or run a test instance of Drogon.
        DbClientManager::instance().init();
        
        // Clear test database or ensure a clean state
        auto dbClient = DbClientManager::instance().getDbClient();
        if (dbClient) {
            dbClient->execSqlSync("DELETE FROM users");
            LOG_INFO("Cleared users table for testing.");
        } else {
            LOG_CRITICAL("Failed to get DB client for test setup.");
            FAIL() << "Failed to connect to test database.";
        }
    }

    static void TearDownTestSuite() {
        LOG_INFO("AuthServiceTestFixture: Tearing down test suite...");
        // Clean up test data
        auto dbClient = DbClientManager::instance().getDbClient();
        if (dbClient) {
            dbClient->execSqlSync("DELETE FROM users");
            LOG_INFO("Cleared users table after testing.");
        }
        // Shut down Drogon components if they were manually started beyond client init
        drogon::app().quit();
    }

    void SetUp() override {
        // Clear users table before each test to ensure isolation
        auto dbClient = DbClientManager::instance().getDbClient();
        if (dbClient) {
            dbClient->execSqlSync("DELETE FROM users");
        }
    }
};

TEST_F(AuthServiceTestFixture, RegisterUserSuccess) {
    std::string email = "test@example.com";
    std::string password = "password123";

    auto user = AuthService::instance().registerUser(email, password);

    ASSERT_TRUE(user.has_value());
    ASSERT_EQ(user->getEmail(), email);
    ASSERT_EQ(user->getRole(), cms::UserRole::USER);

    // Verify user exists in DB
    auto dbClient = DbClientManager::instance().getDbClient();
    drogon::orm::Mapper<drogon_model::cms_system::User> userMapper(dbClient);
    auto foundUsers = userMapper.findBy(drogon::orm::Criteria("email", drogon::orm::CompareOperator::EQ, email));
    ASSERT_FALSE(foundUsers.empty());
    ASSERT_TRUE(PasswordHasher::verifyPassword(password, foundUsers[0].getPasswordHash()));
}

TEST_F(AuthServiceTestFixture, RegisterUserDuplicateEmail) {
    std::string email = "duplicate@example.com";
    std::string password = "password123";

    AuthService::instance().registerUser(email, password); // First registration
    auto user = AuthService::instance().registerUser(email, password); // Second registration

    ASSERT_FALSE(user.has_value()); // Should fail
}

TEST_F(AuthServiceTestFixture, LoginUserSuccess) {
    std::string email = "login@example.com";
    std::string password = "login_password";
    AuthService::instance().registerUser(email, password); // Register first

    auto loginResponse = AuthService::instance().loginUser(email, password);

    ASSERT_TRUE(loginResponse.has_value());
    ASSERT_EQ(loginResponse->userId, "test_user_id"); // Drogon ORM generates UUID, so this is hard to predict
                                                    // In tests, we might manually insert with known UUIDs.
                                                    // For now, checking if userId is non-empty.
    ASSERT_FALSE(loginResponse->userId.empty());
    ASSERT_FALSE(loginResponse->accessToken.empty());
    ASSERT_FALSE(loginResponse->refreshToken.empty());
    ASSERT_EQ(loginResponse->role, cms::UserRole::USER);
}

TEST_F(AuthServiceTestFixture, LoginUserIncorrectPassword) {
    std::string email = "incorrect_pass@example.com";
    std::string password = "correct_password";
    AuthService::instance().registerUser(email, password);

    auto loginResponse = AuthService::instance().loginUser(email, "wrong_password");

    ASSERT_FALSE(loginResponse.has_value());
}

TEST_F(AuthServiceTestFixture, LoginUserNotFound) {
    auto loginResponse = AuthService::instance().loginUser("nonexistent@example.com", "password");
    ASSERT_FALSE(loginResponse.has_value());
}

TEST_F(AuthServiceTestFixture, RefreshTokenSuccess) {
    std::string email = "refresh@example.com";
    std::string password = "refresh_password";
    AuthService::instance().registerUser(email, password);
    auto loginResponse = AuthService::instance().loginUser(email, password);

    ASSERT_TRUE(loginResponse.has_value());

    auto refreshResponse = AuthService::instance().refreshTokens(loginResponse->refreshToken);

    ASSERT_TRUE(refreshResponse.has_value());
    ASSERT_FALSE(refreshResponse->accessToken.empty());
    ASSERT_FALSE(refreshResponse->refreshToken.empty());
    ASSERT_NE(refreshResponse->accessToken, loginResponse->accessToken); // New access token
    ASSERT_NE(refreshResponse->refreshToken, loginResponse->refreshToken); // New refresh token
    ASSERT_TRUE(cms::TokenService::instance().isTokenBlacklisted(loginResponse->refreshToken)); // Old refresh token blacklisted
}

TEST_F(AuthServiceTestFixture, RefreshTokenInvalid) {
    auto refreshResponse = AuthService::instance().refreshTokens("invalid_token");
    ASSERT_FALSE(refreshResponse.has_value());
}

TEST_F(AuthServiceTestFixture, RefreshTokenExpiredOrBlacklisted) {
    std::string email = "expired_refresh@example.com";
    std::string password = "password";
    AuthService::instance().registerUser(email, password);
    auto loginResponse = AuthService::instance().loginUser(email, password);

    ASSERT_TRUE(loginResponse.has_value());

    // Manually blacklist the refresh token
    cms::TokenService::instance().blacklistToken(loginResponse->refreshToken);

    auto refreshResponse = AuthService::instance().refreshTokens(loginResponse->refreshToken);
    ASSERT_FALSE(refreshResponse.has_value());
}

TEST_F(AuthServiceTestFixture, LogoutUser) {
    std::string email = "logout@example.com";
    std::string password = "logout_password";
    AuthService::instance().registerUser(email, password);
    auto loginResponse = AuthService::instance().loginUser(email, password);

    ASSERT_TRUE(loginResponse.has_value());

    AuthService::instance().logoutUser(loginResponse->accessToken, loginResponse->refreshToken);

    // Verify tokens are blacklisted
    ASSERT_TRUE(cms::TokenService::instance().isTokenBlacklisted(loginResponse->accessToken));
    ASSERT_TRUE(cms::TokenService::instance().isTokenBlacklisted(loginResponse->refreshToken));

    // Attempt to use tokens (should fail verification)
    ASSERT_THROW(cms::TokenService::instance().verifyToken(loginResponse->accessToken), jwt::error::token_verification_exception);
    ASSERT_THROW(cms::TokenService::instance().verifyToken(loginResponse->refreshToken), jwt::error::token_verification_exception);
}
```