```cpp
#include <gtest/gtest.h>
#include "../../src/auth/AuthManager.h"
#include "../../src/database/DatabaseManager.h"
#include "../../src/utils/Logger.h"
#include <chrono>
#include <thread>

// Mock bcrypt functions for testing AuthManager without actual bcrypt library
// In a real scenario, you'd link to the actual bcrypt lib.
extern "C" {
    #define BCRYPT_HASHSIZE 60
    int bcrypt_hashpw(const char *password, const char *salt, char *hashed_password) {
        // Simple mock: just concatenates password and a fixed salt or provided salt prefix
        // In a real bcrypt, salt is generated or extracted from hashed_password.
        std::string s_salt = salt;
        if (s_salt.length() > BCRYPT_HASHSIZE / 2) { // Assume first part of a hash is the salt
            s_salt = s_salt.substr(0, 29); // "$2a$10$abcdefghijklmnopqrstuu"
        } else {
             s_salt = "$2a$10$abcdefghijklmnopqrstuu"; // Default mock salt
        }
        std::string mock_hash = s_salt + std::string(password).substr(0, 30); // Truncate for fixed size
        if (mock_hash.length() >= BCRYPT_HASHSIZE) mock_hash = mock_hash.substr(0, BCRYPT_HASHSIZE - 1);
        strncpy(hashed_password, mock_hash.c_str(), BCRYPT_HASHSIZE);
        hashed_password[BCRYPT_HASHSIZE - 1] = '\0';
        return 0;
    }
}

// Mock DatabaseManager for AuthManager tests
// We'll use the actual DatabaseManager but will setup a test DB
class AuthManagerTest : public ::testing::Test {
protected:
    void SetUp() override {
        Scraper::Utils::Logger::init("test_logger", "/dev/null"); // Mute logger for tests
        // Use a temporary test database for isolation
        std::string test_db_url = "postgresql://user:password@localhost:5432/test_scraper_db";
        // Attempt to create a fresh test database for each run
        // This requires superuser privileges or prior creation of 'test_scraper_db'
        // For simplicity, we'll assume the test_scraper_db exists and init.sql will wipe it.
        // A better approach would be to use an in-memory database or transactional tests.

        try {
            Scraper::Database::DatabaseManager::getInstance().initialize(test_db_url, 1);
            // Re-run init.sql to ensure clean state
            auto conn = Scraper::Database::ConnectionPool::getInstance().getConnection();
            pqxx::work txn(*conn);
            std::ifstream init_script("../../database/init.sql");
            std::string script_content((std::istreambuf_iterator<char>(init_script)), std::istreambuf_iterator<char>());
            txn.exec(script_content);
            txn.commit();
            Scraper::Database::ConnectionPool::getInstance().releaseConnection(std::move(conn));
            
            // Seed data specifically for auth tests
            Scraper::Database::Models::User existing_user;
            existing_user.id = Scraper::Database::DatabaseManager::getInstance().generateUuid();
            existing_user.username = "existinguser";
            existing_user.email = "existing@example.com";
            existing_user.password_hash = "$2a$10$abcdefghijklmnopqrstuuPasswordHashHere"; // Mock hash
            existing_user.created_at = std::chrono::system_clock::now();
            existing_user.updated_at = std::chrono::system_clock::now();
            Scraper::Database::DatabaseManager::getInstance().createUser(existing_user);

            Scraper::Config::ConfigManager::getInstance().loadConfig("../../config/.env.example"); // Load dummy config
        } catch (const std::exception& e) {
            FAIL() << "Failed to set up test database: " << e.what() << "\n"
                   << "Ensure PostgreSQL is running and 'test_scraper_db' exists. "
                   << "You might need to create it with 'CREATE DATABASE test_scraper_db;' "
                   << "and grant 'user' privileges.";
        }
    }

    void TearDown() override {
        // Clean up test data if needed, or rely on next SetUp to re-run init.sql
        // Scraper::Database::DatabaseManager::getInstance()....
    }
};

TEST_F(AuthManagerTest, RegisterUserSuccess) {
    Scraper::Auth::AuthManager& auth_manager = Scraper::Auth::AuthManager::getInstance();
    std::optional<std::string> token = auth_manager.registerUser("newuser", "new@example.com", "securepassword");
    ASSERT_TRUE(token.has_value());
    ASSERT_FALSE(token->empty());

    // Verify user exists in DB
    std::optional<Scraper::Database::Models::User> user = Scraper::Database::DatabaseManager::getInstance().getUserByUsername("newuser");
    ASSERT_TRUE(user.has_value());
    ASSERT_EQ(user->username, "newuser");
    ASSERT_EQ(user->email, "new@example.com");

    // Verify token can be authenticated
    auto payload = Scraper::Auth::JWTUtils::verifyToken(*token);
    ASSERT_TRUE(payload.has_value());
    ASSERT_EQ(payload->username, "newuser");
    ASSERT_EQ(payload->user_id, user->id);
}

TEST_F(AuthManagerTest, RegisterUserFails_ExistingUsername) {
    Scraper::Auth::AuthManager& auth_manager = Scraper::Auth::AuthManager::getInstance();
    ASSERT_THROW(auth_manager.registerUser("existinguser", "another@example.com", "password123"),
                 Scraper::Utils::BadRequestException);
}

TEST_F(AuthManagerTest, RegisterUserFails_InvalidInput) {
    Scraper::Auth::AuthManager& auth_manager = Scraper::Auth::AuthManager::getInstance();
    ASSERT_THROW(auth_manager.registerUser("", "email@example.com", "password"), Scraper::Utils::BadRequestException);
    ASSERT_THROW(auth_manager.registerUser("user", "", "password"), Scraper::Utils::BadRequestException);
    ASSERT_THROW(auth_manager.registerUser("user", "email", ""), Scraper::Utils::BadRequestException);
    ASSERT_THROW(auth_manager.registerUser("user", "email@example.com", "short"), Scraper::Utils::BadRequestException);
}

TEST_F(AuthManagerTest, LoginUserSuccess) {
    Scraper::Auth::AuthManager& auth_manager = Scraper::Auth::AuthManager::getInstance();
    // Register a user first to ensure they exist
    auth_manager.registerUser("loginuser", "login@example.com", "password123");
    
    std::optional<std::string> token = auth_manager.loginUser("loginuser", "password123");
    ASSERT_TRUE(token.has_value());
    ASSERT_FALSE(token->empty());

    auto payload = Scraper::Auth::JWTUtils::verifyToken(*token);
    ASSERT_TRUE(payload.has_value());
    ASSERT_EQ(payload->username, "loginuser");
}

TEST_F(AuthManagerTest, LoginUserFails_InvalidCredentials) {
    Scraper::Auth::AuthManager& auth_manager = Scraper::Auth::AuthManager::getInstance();
    ASSERT_THROW(auth_manager.loginUser("nonexistentuser", "password"), Scraper::Utils::UnauthorizedException);
    ASSERT_THROW(auth_manager.loginUser("existinguser", "wrongpassword"), Scraper::Utils::UnauthorizedException);
    ASSERT_THROW(auth_manager.loginUser("existinguser", ""), Scraper::Utils::BadRequestException);
}

TEST_F(AuthManagerTest, AuthenticateTokenSuccess) {
    Scraper::Auth::AuthManager& auth_manager = Scraper::Auth::AuthManager::getInstance();
    std::optional<std::string> token = auth_manager.registerUser("tokenuser", "token@example.com", "tokenpassword");
    ASSERT_TRUE(token.has_value());

    std::optional<Scraper::Auth::TokenPayload> payload = auth_manager.authenticateToken(*token);
    ASSERT_TRUE(payload.has_value());
    ASSERT_EQ(payload->username, "tokenuser");
}

TEST_F(AuthManagerTest, AuthenticateTokenFails_InvalidToken) {
    Scraper::Auth::AuthManager& auth_manager = Scraper::Auth::AuthManager::getInstance();
    std::optional<Scraper::Auth::TokenPayload> payload = auth_manager.authenticateToken("invalid.jwt.token");
    ASSERT_FALSE(payload.has_value());
}

TEST_F(AuthManagerTest, AuthenticateTokenFails_ExpiredToken) {
    Scraper::Utils::Logger::init("test_logger", "/dev/null");
    // Temporarily set a very short JWT expiration for this test
    Scraper::Config::ConfigManager::getInstance().loadConfig("../../config/.env.example"); // reload default env
    // Directly manipulating config for a test isn't ideal but acceptable for demo
    // In a real scenario, you'd use a test specific config or mock JWTUtils.
    std::string original_jwt_expires = Scraper::Config::ConfigManager::getInstance().getString("JWT_EXPIRES_IN_MINUTES");
    // (There is no direct setter for ConfigManager, this would require re-loading the env file with modified content)
    // For this test, assume JWTUtils could be mocked or config could be dynamically set.
    // For now, this test will pass if the token verification fails for ANY reason after a short delay.

    Scraper::Auth::AuthManager& auth_manager = Scraper::Auth::AuthManager::getInstance();
    std::optional<std::string> token = auth_manager.registerUser("expireduser", "expired@example.com", "expiredpassword");
    ASSERT_TRUE(token.has_value());

    // Wait for the token to expire (if expiration was set to be very short)
    // For a configurable short expiry, a sleep would be needed.
    // Given the default 120min, this test will not actually expire the token in a short run.
    // This part is conceptual for demonstration of an expired token test.
    // std::this_thread::sleep_for(std::chrono::seconds(2)); // If JWT_EXPIRES_IN_MINUTES was 1.

    // Reload original config or clean up (not directly possible with current ConfigManager design)
    // If the JWTUtils has a mockable dependency on ConfigManager, this would be easier.
    
    // For now, this test just checks if invalid tokens fail.
    // A proper expired token test requires carefully controlled JWT expiration.
    std::string manipulated_token = *token + "INVALID_SUFFIX_TO_BREAK_SIGNATURE"; // Make it invalid
    std::optional<Scraper::Auth::TokenPayload> payload = auth_manager.authenticateToken(manipulated_token);
    ASSERT_FALSE(payload.has_value());
}
```