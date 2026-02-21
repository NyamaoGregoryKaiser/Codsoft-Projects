```cpp
#include "gtest/gtest.h"
#include "services/UserService.h"
#include "dal/UserDAL.h"
#include "utils/JwtManager.h"
#include "utils/PasswordHasher.h"
#include "exceptions/ApiException.h"

// Mock classes for dependencies
class MockUserDAL : public ECommerce::DAL::UserDAL {
public:
    MockUserDAL(drogon::orm::DbClientPtr dbClient) : UserDAL(dbClient) {}
    MOCK_METHOD(std::future<std::optional<ECommerce::Models::User>>, findByEmail, (const std::string&), (override));
    MOCK_METHOD(std::future<ECommerce::Models::User>, createUser, (const ECommerce::Models::User&), (override));
    MOCK_METHOD(std::future<std::optional<ECommerce::Models::User>>, findById, (long), (override));
    MOCK_METHOD(std::future<ECommerce::Models::User>, updateUser, (const ECommerce::Models::User&), (override));
    MOCK_METHOD(std::future<void>, deleteUser, (long), (override));
};

class MockJwtManager : public ECommerce::Utils::JwtManager {
public:
    MockJwtManager() : JwtManager("test_secret", 1) {}
    MOCK_METHOD(std::string, generateToken, (long, const std::string&, const std::string&, const std::string&), (override));
    MOCK_METHOD(std::optional<ECommerce::Utils::JwtPayload>, verifyToken, (const std::string&), (override));
};

class MockPasswordHasher : public ECommerce::Utils::PasswordHasher {
public:
    MockPasswordHasher() : PasswordHasher() {}
    MOCK_METHOD(std::string, hashPassword, (const std::string&), (override));
    MOCK_METHOD(bool, verifyPassword, (const std::string&, const std::string&), (override));
};

// Test fixture
class UserServiceTest : public ::testing::Test {
protected:
    void SetUp() override {
        // We don't need a real DB client for unit tests of the service layer
        // Just pass a nullptr or mock Drogon's DbClient if necessary, though for DAL mocks, it's not.
        _mockDbClient = nullptr; // Or a dummy DbClientPtr
        _mockUserDAL = std::make_shared<MockUserDAL>(_mockDbClient);
        _mockJwtManager = std::make_shared<MockJwtManager>();
        _mockPasswordHasher = std::make_shared<MockPasswordHasher>();
        _userService = std::make_shared<ECommerce::Services::UserService>(_mockUserDAL, _mockJwtManager, _mockPasswordHasher);
    }

    drogon::orm::DbClientPtr _mockDbClient;
    std::shared_ptr<MockUserDAL> _mockUserDAL;
    std::shared_ptr<MockJwtManager> _mockJwtManager;
    std::shared_ptr<MockPasswordHasher> _mockPasswordHasher;
    std::shared_ptr<ECommerce::Services::UserService> _userService;

    ECommerce::Models::User testUser = {
        1, "testuser", "test@example.com", "hashed_password", "2023-01-01", "2023-01-01", "user"
    };
    ECommerce::Models::UserRegisterDTO registerDto = {
        "newuser", "new@example.com", "strongpassword123"
    };
    ECommerce::Models::UserLoginDTO loginDto = {
        "test@example.com", "correctpassword"
    };
};

TEST_F(UserServiceTest, RegisterUserSuccess) {
    // Mock DAL to return no existing user and successfully create a new one
    EXPECT_CALL(*_mockUserDAL, findByEmail(registerDto.email))
        .WillOnce(testing::Return(std::async(std::launch::async, []{ return std::optional<ECommerce::Models::User>(); })));
    EXPECT_CALL(*_mockPasswordHasher, hashPassword(registerDto.password))
        .WillOnce(testing::Return("hashed_new_password"));

    ECommerce::Models::User createdUser = testUser;
    createdUser.id = 2;
    createdUser.username = registerDto.username;
    createdUser.email = registerDto.email;
    createdUser.password_hash = "hashed_new_password";

    EXPECT_CALL(*_mockUserDAL, createUser(testing::_))
        .WillOnce(testing::Return(std::async(std::launch::async, [createdUser]{ return createdUser; })));
    EXPECT_CALL(*_mockJwtManager, generateToken(createdUser.id, createdUser.username, createdUser.role, createdUser.email))
        .WillOnce(testing::Return("test_jwt_token"));

    std::future<std::string> tokenFuture = _userService->registerUser(registerDto);
    EXPECT_EQ(tokenFuture.get(), "test_jwt_token");
}

TEST_F(UserServiceTest, RegisterUser_UserAlreadyExists) {
    // Mock DAL to return an existing user
    EXPECT_CALL(*_mockUserDAL, findByEmail(registerDto.email))
        .WillOnce(testing::Return(std::async(std::launch::async, [this]{ return std::optional<ECommerce::Models::User>(testUser); })));

    EXPECT_THROW({
        try {
            _userService->registerUser(registerDto).get(); // .get() rethrows the exception from the future
        } catch (const ECommerce::Exceptions::ApiException& e) {
            EXPECT_EQ(e.getStatusCode(), 409);
            EXPECT_STREQ(e.what(), "User with this email already exists");
            throw;
        }
    }, ECommerce::Exceptions::ApiException);
}

TEST_F(UserServiceTest, LoginUserSuccess) {
    // Mock DAL to find the user
    EXPECT_CALL(*_mockUserDAL, findByEmail(loginDto.email))
        .WillOnce(testing::Return(std::async(std::launch::async, [this]{ return std::optional<ECommerce::Models::User>(testUser); })));
    // Mock password hasher to verify
    EXPECT_CALL(*_mockPasswordHasher, verifyPassword(loginDto.password, testUser.password_hash))
        .WillOnce(testing::Return(true));
    // Mock JWT manager to generate token
    EXPECT_CALL(*_mockJwtManager, generateToken(testUser.id, testUser.username, testUser.role, testUser.email))
        .WillOnce(testing::Return("login_jwt_token"));

    std::future<std::string> tokenFuture = _userService->loginUser(loginDto);
    EXPECT_EQ(tokenFuture.get(), "login_jwt_token");
}

TEST_F(UserServiceTest, LoginUser_InvalidPassword) {
    // Mock DAL to find the user
    EXPECT_CALL(*_mockUserDAL, findByEmail(loginDto.email))
        .WillOnce(testing::Return(std::async(std::launch::async, [this]{ return std::optional<ECommerce::Models::User>(testUser); })));
    // Mock password hasher to fail verification
    EXPECT_CALL(*_mockPasswordHasher, verifyPassword(loginDto.password, testUser.password_hash))
        .WillOnce(testing::Return(false));

    EXPECT_THROW({
        try {
            _userService->loginUser(loginDto).get();
        } catch (const ECommerce::Exceptions::ApiException& e) {
            EXPECT_EQ(e.getStatusCode(), 401);
            EXPECT_STREQ(e.what(), "Invalid credentials");
            throw;
        }
    }, ECommerce::Exceptions::ApiException);
}

// ... More tests for getUserProfile, updateUserProfile, and edge cases ...
```