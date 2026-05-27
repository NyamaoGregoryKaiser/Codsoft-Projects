#include "gtest/gtest.h"
#include "../../services/auth_service.hpp"
#include "../../repositories/user_repository.hpp"
#include "../../repositories/db_connection.hpp"
#include "../../utils/jwt_manager.hpp"
#include "../../utils/logger.hpp"
#include "../../config/config.hpp"
#include <memory>
#include <stdexcept>

// Mock DBConnectionPool for tests
class MockDBConnectionPool : public DBConnectionPool {
public:
    MockDBConnectionPool() : DBConnectionPool("host=mock port=1 user=mock dbname=mock password=mock", 1) {}

    // Override acquireConnection to return a dummy connection for tests
    std::unique_ptr<DBConnection> acquireConnection() override {
        // In a real mock, you'd return a mock pqxx::connection
        // For unit tests of AuthService, we might not even need a real DB connection,
        // just to ensure UserRepository doesn't crash on pool->acquireConnection()
        return std::make_unique<DBConnection>("host=mock port=1 user=mock dbname=mock password=mock");
    }

    void releaseConnection(std::unique_ptr<DBConnection> conn) override {
        // Do nothing in mock release
        (void)conn;
    }
};

// Test fixture for AuthService
class AuthServiceTest : public ::testing::Test {
protected:
    std::shared_ptr<MockDBConnectionPool> mock_db_pool;
    std::shared_ptr<UserRepository> user_repo;
    std::shared_ptr<AuthService> auth_service;

    void SetUp() override {
        // Initialize logger and config for tests
        Logger::init();
        Config::loadFromEnv();
        JWTManager::init("test_jwt_secret", 1); // Use a test secret and short expiration

        mock_db_pool = std::make_shared<MockDBConnectionPool>();
        user_repo = std::make_shared<UserRepository>(mock_db_pool);
        auth_service = std::make_shared<AuthService>(user_repo);
    }

    void TearDown() override {
        // Clean up any test specific data if necessary
    }
};

TEST_F(AuthServiceTest, RegisterUserSuccess) {
    // Mock createUser to return a dummy user
    EXPECT_CALL(*user_repo, createUser(::testing::_))
        .WillOnce(::testing::Return(User{1, "test@example.com", "$2a$10$SALT_PREFIX_MOCK_XYZtest_password_HASH", "user", std::chrono::system_clock::now(), std::chrono::system_clock::now()}));

    User registered_user = auth_service->registerUser("test@example.com", "test_password");
    ASSERT_EQ(registered_user.email, "test@example.com");
    ASSERT_EQ(registered_user.role, "user");
    ASSERT_GT(registered_user.id, 0);
}

TEST_F(AuthServiceTest, RegisterUserDuplicateEmail) {
    // Mock findByEmail to indicate user already exists
    EXPECT_CALL(*user_repo, findByEmail("duplicate@example.com"))
        .WillOnce(::testing::Return(User{1, "duplicate@example.com", "hash", "user", {}, {}}));

    ASSERT_THROW(auth_service->registerUser("duplicate@example.com", "password"), std::runtime_error);
}

TEST_F(AuthServiceTest, LoginUserSuccess) {
    std::string test_email = "login@example.com";
    std::string test_password = "login_password";
    User mock_user{101, test_email, BCrypt::generateHash(test_password), "user", {}, {}};

    // Mock findByEmail to return the mock user
    EXPECT_CALL(*user_repo, findByEmail(test_email))
        .WillOnce(::testing::Return(mock_user));

    std::string token = auth_service->loginUser(test_email, test_password);
    ASSERT_FALSE(token.empty());

    // Verify the token content
    auto decoded = JWTManager::verifyToken(token);
    ASSERT_EQ(decoded.get_payload_claim(Constants::CLAIM_USER_ID).as_string(), std::to_string(mock_user.id));
    ASSERT_EQ(decoded.get_payload_claim(Constants::CLAIM_USER_ROLE).as_string(), mock_user.role);
}

TEST_F(AuthServiceTest, LoginUserInvalidCredentials) {
    std::string test_email = "invalid@example.com";
    std::string test_password = "wrong_password";
    User mock_user{102, test_email, BCrypt::generateHash("correct_password"), "user", {}, {}};

    // Mock findByEmail to return the user (but password will be wrong)
    EXPECT_CALL(*user_repo, findByEmail(test_email))
        .WillOnce(::testing::Return(mock_user));

    ASSERT_THROW(auth_service->loginUser(test_email, test_password), std::runtime_error);
}

TEST_F(AuthServiceTest, LoginUserNotFound) {
    std::string test_email = "nonexistent@example.com";
    std::string test_password = "any_password";

    // Mock findByEmail to return nullopt
    EXPECT_CALL(*user_repo, findByEmail(test_email))
        .WillOnce(::testing::Return(std::nullopt));

    ASSERT_THROW(auth_service->loginUser(test_email, test_password), std::runtime_error);
}
```