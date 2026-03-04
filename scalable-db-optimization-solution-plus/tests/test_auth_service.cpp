```cpp
#include "gtest/gtest.h"
#include "services/auth_service.h"
#include "db/postgres_connection.h"
#include "utils/jwt_manager.h"
#include "common/exceptions.h"
#include "config/config.h"

#include <memory>
#include <pqxx/pqxx>

// Helper to get config from environment for tests
OptiDBConfig get_test_config() {
    // These values should match what's set in the CI workflow or local .env for testing
    OptiDBConfig config;
    config.db_host = "localhost";
    config.db_port = "5432";
    config.db_name = "optidb_test";
    config.db_user = "optidb_test_user";
    config.db_password = "optidb_test_password";
    config.jwt_secret = "test_secret_for_ci"; // Must match .env.example/CI
    config.jwt_expiry_seconds = 360;
    config.server_port = 8080;
    config.log_level = "DEBUG";
    config.target_db_connection_timeout_ms = 1000;
    config.target_db_max_concurrent_connections = 1;
    return config;
}

// Fixture for AuthService tests
class AuthServiceTest : public ::testing::Test {
protected:
    std::shared_ptr<PostgresConnection> db_conn;
    std::shared_ptr<JWTManager> jwt_manager;
    std::unique_ptr<AuthService> auth_service;
    OptiDBConfig config;

    void SetUp() override {
        config = get_test_config();
        db_conn = std::make_shared<PostgresConnection>(config, 1); // Small pool for testing
        jwt_manager = std::make_shared<JWTManager>(config);
        auth_service = std::make_unique<AuthService>(db_conn, jwt_manager);

        // Clear test data before each test
        auto conn_ptr = db_conn->get_connection();
        pqxx::work txn(*conn_ptr);
        txn.exec("DELETE FROM users CASCADE;");
        txn.commit();
        db_conn->release_connection(conn_ptr);
    }

    void TearDown() override {
        // Clean up after each test
        auto conn_ptr = db_conn->get_connection();
        pqxx::work txn(*conn_ptr);
        txn.exec("DELETE FROM users CASCADE;");
        txn.commit();
        db_conn->release_connection(conn_ptr);
    }
};

TEST_F(AuthServiceTest, RegisterUserSuccess) {
    User user = auth_service->register_user("testuser", "test@example.com", "password123");
    ASSERT_GT(user.id, 0);
    ASSERT_EQ(user.username, "testuser");
    ASSERT_EQ(user.email, "test@example.com");

    // Verify user exists in DB
    auto fetched_user_opt = auth_service->get_user_by_id(user.id);
    ASSERT_TRUE(fetched_user_opt.has_value());
    ASSERT_EQ(fetched_user_opt->username, "testuser");
}

TEST_F(AuthServiceTest, RegisterDuplicateUserFails) {
    auth_service->register_user("duplicateuser", "dup@example.com", "pass");
    ASSERT_THROW(auth_service->register_user("duplicateuser", "dup2@example.com", "pass2"), ConflictException);
}

TEST_F(AuthServiceTest, LoginUserSuccess) {
    auth_service->register_user("loginuser", "login@example.com", "loginpass");
    std::string token = auth_service->login_user("loginuser", "loginpass");
    ASSERT_FALSE(token.empty());

    // Validate token (via JWTManager directly for unit testing)
    long user_id = jwt_manager->validate_token(token);
    ASSERT_GT(user_id, 0);
}

TEST_F(AuthServiceTest, LoginUserInvalidPasswordFails) {
    auth_service->register_user("badpassuser", "badpass@example.com", "correctpass");
    ASSERT_THROW(auth_service->login_user("badpassuser", "wrongpass"), UnauthorizedException);
}

TEST_F(AuthServiceTest, LoginUserNotFoundFails) {
    ASSERT_THROW(auth_service->login_user("nonexistent", "anypass"), UnauthorizedException);
}

TEST_F(AuthServiceTest, GetUserByIdFound) {
    User registered_user = auth_service->register_user("getbyiduser", "getbyid@example.com", "pass");
    auto fetched_user_opt = auth_service->get_user_by_id(registered_user.id);
    ASSERT_TRUE(fetched_user_opt.has_value());
    ASSERT_EQ(fetched_user_opt->id, registered_user.id);
    ASSERT_EQ(fetched_user_opt->username, registered_user.username);
}

TEST_F(AuthServiceTest, GetUserByIdNotFound) {
    auto fetched_user_opt = auth_service->get_user_by_id(99999); // Non-existent ID
    ASSERT_FALSE(fetched_user_opt.has_value());
}
```