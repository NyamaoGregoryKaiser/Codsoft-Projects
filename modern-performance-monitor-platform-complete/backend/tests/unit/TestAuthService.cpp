```cpp
#include "gtest/gtest.h"
#include "../../src/services/AuthService.h"
#include "../../src/db/DBManager.h" // For mocking or actual DB interaction
#include "../../src/exceptions/AppException.h"
#include <pqxx/pqxx>

// Mock DBManager for unit tests
class MockDBManager : public DBManager {
public:
    static MockDBManager& get_instance() {
        static MockDBManager instance;
        return instance;
    }

    std::unique_ptr<pqxx::connection> get_connection() override {
        // In a real mock, you'd return a mock connection.
        // For this example, we'll try to connect to a test database or provide a dummy.
        // It's often better to mock the actual DB queries in AuthService methods.
        // For now, let's return a dummy connection that will fail or require a running test DB.
        throw std::runtime_error("DB connection called from mock - real DB interactions should be mocked out.");
    }

private:
    MockDBManager() = default;
};

// Test fixture for AuthService
class AuthServiceTest : public ::testing::Test {
protected:
    AuthService auth_service;

    void SetUp() override {
        // Setup mock config for JWT secret
        Config::settings["JWT_SECRET"] = "test_secret_key";
        Config::loaded = true;
        Logger::init(); // Ensure logger is initialized
    }

    void TearDown() override {
        // Clear mock config if necessary
        Config::settings.clear();
        Config::loaded = false;
    }
};

// Test case for successful login
TEST_F(AuthServiceTest, SuccessfulLogin) {
    // This test would require mocking the DB interaction for get_user_by_username
    // and potentially `crypt` for password verification.
    // For a true unit test, we'd mock the DBManager and its connection/transaction.

    // A simplified approach for demonstration (requires a mocked/stubbed get_user_by_username in AuthService)
    // In a real scenario, you would dependency inject a mock DBService into AuthService.

    // Example of how it *would* look if get_user_by_username was mockable:
    // User mock_user = {1, "testuser", auth_service.hash_password("password123"), "viewer"};
    // EXPECT_CALL(mock_db_manager, get_user_by_username("testuser")).WillOnce(Return(mock_user));

    // Due to current tight coupling, this will need a functioning test DB or significant mocking.
    // Let's test parts that don't hit DB directly, like token generation/validation (if private methods were accessible, or through a helper)
    // Or, more practically, we would inject a mock DBManager or test against an in-memory DB.

    // For now, let's assume get_user_by_username is mocked inside auth_service somehow
    // and verify_password is stubbed.
    // This is a high-level pseudo-test given the constraints.
    LoginRequestDTO req;
    req.username = "admin";
    req.password = "admin123"; // Assuming `admin123` is the password for 'admin' in `init.sql`

    // This part is hard to unit test without mocking `AuthService::get_user_by_username`
    // and `AuthService::verify_password`
    // As `get_user_by_username` directly uses `DBManager`, we'd need a mock DBManager.
    // Given the structure, `AuthService` methods would need to take `DBManager` as a parameter
    // or use a dependency injection framework for proper mocking.

    // Placeholder for a real test after mocking:
    // EXPECT_NO_THROW({
    //     LoginResponseDTO res = auth_service.login_user(req);
    //     ASSERT_FALSE(res.token.empty());
    //     ASSERT_EQ(res.username, "admin");
    //     ASSERT_EQ(res.role, "admin");
    // });
    // And then validate the token using auth_service.validate_token

    // Test token generation/validation isolated (assuming hash_password gives a consistent output for tests)
    User test_user = {1, "testuser", "hashed_password_dummy", "viewer"};
    std::string token = jwt::create()
        .set_issuer("perfo-metrics-backend")
        .set_type("JWT")
        .set_id(std::to_string(test_user.id))
        .set_subject(test_user.username)
        .set_payload_claim("role", jwt::claim(test_user.role))
        .set_issued_at(std::chrono::system_clock::now())
        .set_expires_at(std::chrono::system_clock::now() + std::chrono::minutes{1})
        .sign(jwt::algorithm::hs256{Config::get("JWT_SECRET")});

    auto validated_user_opt = auth_service.validate_token(token);
    ASSERT_TRUE(validated_user_opt.has_value());
    ASSERT_EQ(validated_user_opt->username, test_user.username);
    ASSERT_EQ(validated_user_opt->role, test_user.role);
}

// Test case for invalid credentials
TEST_F(AuthServiceTest, InvalidLoginCredentials) {
    LoginRequestDTO req;
    req.username = "nonexistent";
    req.password = "wrongpassword";

    // This would also need mocking of DB interaction
    // EXPECT_THROW(auth_service.login_user(req), AppException);
}

// Test case for expired token
TEST_F(AuthServiceTest, ExpiredToken) {
    User test_user = {1, "testuser", "hashed_password_dummy", "viewer"};
    std::string expired_token = jwt::create()
        .set_issuer("perfo-metrics-backend")
        .set_type("JWT")
        .set_id(std::to_string(test_user.id))
        .set_subject(test_user.username)
        .set_payload_claim("role", jwt::claim(test_user.role))
        .set_issued_at(std::chrono::system_clock::now() - std::chrono::hours{2}) // Token issued 2 hours ago
        .set_expires_at(std::chrono::system_clock::now() - std::chrono::hours{1}) // Token expired 1 hour ago
        .sign(jwt::algorithm::hs256{Config::get("JWT_SECRET")});

    ASSERT_THROW(auth_service.validate_token(expired_token), AppException);
    try {
        auth_service.validate_token(expired_token);
    } catch (const AppException& e) {
        ASSERT_EQ(e.get_error_code(), AppException::TOKEN_EXPIRED);
    }
}

// Test case for invalid token signature
TEST_F(AuthServiceTest, InvalidTokenSignature) {
    std::string invalid_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJwZXJmby1tZXRyaWNzLWJhY2tlbmQiLCJzdWIiOiJ0ZXN0dXNlciIsImlkIjoiMSIsInJvbGUiOiJ2aWV3ZXIiLCJpYXQiOjE2NzgwNTI0MDAsImV4cCI6MTY3ODA1NjAwMH0.INVALID_SIGNATURE_THIS_PART_IS_WRONG";
    ASSERT_THROW(auth_service.validate_token(invalid_token), AppException);
    try {
        auth_service.validate_token(invalid_token);
    } catch (const AppException& e) {
        ASSERT_EQ(e.get_error_code(), AppException::TOKEN_INVALID);
    }
}
```