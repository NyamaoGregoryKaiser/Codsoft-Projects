#include <gtest/gtest.h>
#include <drogon/drogon.h>
#include <drogon/orm/DbClient.h>
#include <drogon/orm/Exception.h>
#include "services/UserService.h"
#include "utils/PasswordHasher.h"
#include "utils/JwtManager.h"
#include <future> // For std::promise/std::future

// Global setup for Drogon application context for integration tests
class DrogonAppFixture : public ::testing::Environment {
public:
    void SetUp() override {
        // Initialize Drogon application (only once)
        // This is a minimal setup to allow DbClient and config access
        // It prevents actual server from starting by not calling drogon::app().run()
        // and setting up database connection from config.json.
        // Ensure config.json points to a test database.
        LOG_INFO << "DrogonAppFixture: Setting up Drogon app for tests.";
        // Avoid starting the actual HTTP server in tests
        drogon::app().setLogPath("./logs");
        drogon::app().setLogLevel(trantor::Logger::LogLevel::kDebug);
        drogon::app().setCustomConfigPath("../src/config.json"); // Point to the app's config
        drogon::app().loadConfigFile("../src/config.json");
        drogon::app().initialize(); // Initializes internal components like DbClient
        LOG_INFO << "DrogonAppFixture: Drogon app initialized.";

        // Set JWT secret for tests
        JwtManager::setSecret("test_jwt_secret_for_integration");

        // Clear test database before running tests
        auto dbClient = drogon::app().getDbClient();
        if (dbClient) {
            std::promise<void> promise;
            dbClient->execSqlAsync("DELETE FROM content; DELETE FROM users;",
                [&promise](const drogon::orm::Result&){
                    LOG_INFO << "Test database cleared.";
                    promise.set_value();
                },
                [&promise](const drogon::orm::DrogonDbException& e){
                    LOG_ERROR << "Failed to clear test database: " << e.what();
                    promise.set_exception(std::current_exception());
                }
            );
            promise.get_future().get(); // Wait for DB clear to complete
        }
    }

    void TearDown() override {
        LOG_INFO << "DrogonAppFixture: Tearing down Drogon app.";
        // Drogon doesn't have a simple "stop" for this non-running state.
        // Its components might still be alive. For a clean shutdown of threads etc.,
        // a more controlled environment or mocking is typically used.
        // For basic DbClient tests, this might be sufficient.
        drogon::app().quit(); // Attempt to quit, though full cleanup might require more.
    }
};

// Add the fixture to the Google Test framework
// This ensures DrogonAppFixture::SetUp and TearDown are called once for all tests
// int main(int argc, char **argv) {
//     ::testing::AddGlobalTestEnvironment(new DrogonAppFixture());
//     ::testing::InitGoogleTest(&argc, argv);
//     return RUN_ALL_TESTS();
// }
// The above main is commented out because it's handled by test/CMakeLists.txt which links gtest_main

// Test suite for UserService
class UserServiceTest : public ::testing::Test {
protected:
    void SetUp() override {
        // Clear specific data before each test if necessary, or rely on global fixture
        // For this example, relying on global fixture to clear DB once.
        LOG_INFO << "UserServiceTest: SetUp for a new test case.";
    }

    void TearDown() override {
        LOG_INFO << "UserServiceTest: TearDown for test case.";
    }
};

TEST_F(UserServiceTest, RegisterUserSuccess) {
    std::promise<std::pair<User, std::string>> promise;
    std::future<std::pair<User, std::string>> future = promise.get_future();
    std::string expectedError = "";

    UserService::getInstance()->registerUser("testuser1", "test1@example.com", "password123",
        [&](const std::pair<User, std::string>& result, const std::string& error) {
            promise.set_value(result);
            expectedError = error;
        }
    );

    std::pair<User, std::string> result = future.get();
    ASSERT_TRUE(expectedError.empty());
    ASSERT_FALSE(result.first.id.empty());
    ASSERT_EQ(result.first.username, "testuser1");
    ASSERT_EQ(result.first.email, "test1@example.com");
    ASSERT_EQ(result.first.role, "user");
    ASSERT_FALSE(result.second.empty()); // Check if token is generated
    ASSERT_TRUE(JwtManager::verifyToken(result.second, Json::Value(), expectedError)); // Verify token
}

TEST_F(UserServiceTest, RegisterDuplicateUser) {
    // First register a user
    std::promise<std::pair<User, std::string>> p1;
    UserService::getInstance()->registerUser("dupuser", "dup@example.com", "password123",
        [&p1](const std::pair<User, std::string>& res, const std::string& err) { p1.set_value(res); }
    );
    p1.get_future().get(); // Wait for first registration

    // Now try to register again with same username
    std::promise<std::string> p2_error;
    std::future<std::string> f2_error = p2_error.get_future();
    UserService::getInstance()->registerUser("dupuser", "dup2@example.com", "password123",
        [&p2_error](const std::pair<User, std::string>& res, const std::string& err) { p2_error.set_value(err); }
    );

    std::string error = f2_error.get();
    ASSERT_FALSE(error.empty());
    ASSERT_NE(error.find("duplicate key value violates unique constraint"), std::string::npos);
}

TEST_F(UserServiceTest, AuthenticateUserSuccess) {
    std::promise<std::pair<User, std::string>> p_reg;
    UserService::getInstance()->registerUser("authuser", "auth@example.com", "authpassword",
        [&p_reg](const std::pair<User, std::string>& res, const std::string& err) { p_reg.set_value(res); }
    );
    p_reg.get_future().get(); // Wait for registration

    std::promise<std::pair<User, std::string>> p_auth;
    std::future<std::pair<User, std::string>> f_auth = p_auth.get_future();
    std::string expectedError = "";

    UserService::getInstance()->authenticateUser("authuser", "authpassword",
        [&](const std::pair<User, std::string>& result, const std::string& error) {
            p_auth.set_value(result);
            expectedError = error;
        }
    );

    std::pair<User, std::string> result = f_auth.get();
    ASSERT_TRUE(expectedError.empty());
    ASSERT_EQ(result.first.username, "authuser");
    ASSERT_FALSE(result.second.empty()); // Token should be present
}

TEST_F(UserServiceTest, AuthenticateUserInvalidPassword) {
    std::promise<std::pair<User, std::string>> p_reg;
    UserService::getInstance()->registerUser("badpassuser", "badpass@example.com", "correctpassword",
        [&p_reg](const std::pair<User, std::string>& res, const std::string& err) { p_reg.set_value(res); }
    );
    p_reg.get_future().get(); // Wait for registration

    std::promise<std::string> p_error;
    std::future<std::string> f_error = p_error.get_future();

    UserService::getInstance()->authenticateUser("badpassuser", "wrongpassword",
        [&p_error](const std::pair<User, std::string>& res, const std::string& err) { p_error.set_value(err); }
    );

    std::string error = f_error.get();
    ASSERT_FALSE(error.empty());
    ASSERT_EQ(error, "Invalid password.");
}

TEST_F(UserServiceTest, GetAllUsers) {
    // Ensure at least one user exists from previous tests or seed data if fixture not clearing
    std::promise<std::pair<User, std::string>> p_reg;
    UserService::getInstance()->registerUser("listuser", "list@example.com", "password",
        [&p_reg](const std::pair<User, std::string>& res, const std::string& err) { p_reg.set_value(res); }
    );
    p_reg.get_future().get();

    std::promise<std::vector<User>> p_list;
    std::future<std::vector<User>> f_list = p_list.get_future();
    std::string expectedError = "";

    UserService::getInstance()->getAllUsers(
        [&](const std::vector<User>& users, const std::string& error) {
            p_list.set_value(users);
            expectedError = error;
        }
    );

    std::vector<User> users = f_list.get();
    ASSERT_TRUE(expectedError.empty());
    ASSERT_FALSE(users.empty());
    ASSERT_GE(users.size(), 1); // At least one user should be present
}

TEST_F(UserServiceTest, GetUserByIdSuccess) {
    std::promise<std::pair<User, std::string>> p_reg;
    UserService::getInstance()->registerUser("getuser", "get@example.com", "password",
        [&p_reg](const std::pair<User, std::string>& res, const std::string& err) { p_reg.set_value(res); }
    );
    User registeredUser = p_reg.get_future().get().first;

    std::promise<std::optional<User>> p_get;
    std::future<std::optional<User>> f_get = p_get.get_future();
    std::string expectedError = "";

    UserService::getInstance()->getUserById(registeredUser.id,
        [&](const std::optional<User>& user, const std::string& error) {
            p_get.set_value(user);
            expectedError = error;
        }
    );

    std::optional<User> fetchedUser = f_get.get();
    ASSERT_TRUE(expectedError.empty());
    ASSERT_TRUE(fetchedUser.has_value());
    ASSERT_EQ(fetchedUser->id, registeredUser.id);
    ASSERT_EQ(fetchedUser->username, registeredUser.username);
}

TEST_F(UserServiceTest, GetUserByIdNotFound) {
    std::promise<std::optional<User>> p_get;
    std::future<std::optional<User>> f_get = p_get.get_future();
    std::string expectedError = "";

    UserService::getInstance()->getUserById("non_existent_uuid",
        [&](const std::optional<User>& user, const std::string& error) {
            p_get.set_value(user);
            expectedError = error;
        }
    );

    std::optional<User> fetchedUser = f_get.get();
    ASSERT_TRUE(expectedError.empty());
    ASSERT_FALSE(fetchedUser.has_value());
}

TEST_F(UserServiceTest, UpdateUserSuccess) {
    std::promise<std::pair<User, std::string>> p_reg;
    UserService::getInstance()->registerUser("updateuser", "update@example.com", "oldpassword",
        [&p_reg](const std::pair<User, std::string>& res, const std::string& err) { p_reg.set_value(res); }
    );
    User originalUser = p_reg.get_future().get().first;

    Json::Value updates;
    updates["username"] = "updated_username";
    updates["email"] = "updated@example.com";
    updates["password"] = "newpassword"; // Password hash should update

    std::promise<std::optional<User>> p_update;
    std::future<std::optional<User>> f_update = p_update.get_future();
    std::string expectedError = "";

    UserService::getInstance()->updateUser(originalUser.id, updates,
        [&](const std::optional<User>& user, const std::string& error) {
            p_update.set_value(user);
            expectedError = error;
        }
    );

    std::optional<User> updatedUser = f_update.get();
    ASSERT_TRUE(expectedError.empty());
    ASSERT_TRUE(updatedUser.has_value());
    ASSERT_EQ(updatedUser->id, originalUser.id);
    ASSERT_EQ(updatedUser->username, "updated_username");
    ASSERT_EQ(updatedUser->email, "updated@example.com");

    // Verify new password
    std::promise<std::pair<User, std::string>> p_auth;
    UserService::getInstance()->authenticateUser("updated_username", "newpassword",
        [&p_auth](const std::pair<User, std::string>& res, const std::string& err) { p_auth.set_value(res); }
    );
    std::pair<User, std::string> authResult = p_auth.get_future().get();
    ASSERT_TRUE(authResult.first.id == originalUser.id); // Should be authenticated
}

TEST_F(UserServiceTest, DeleteUserSuccess) {
    std::promise<std::pair<User, std::string>> p_reg;
    UserService::getInstance()->registerUser("deleteuser", "delete@example.com", "password",
        [&p_reg](const std::pair<User, std::string>& res, const std::string& err) { p_reg.set_value(res); }
    );
    User userToDelete = p_reg.get_future().get().first;

    std::promise<bool> p_delete;
    std::future<bool> f_delete = p_delete.get_future();
    std::string expectedError = "";

    UserService::getInstance()->deleteUser(userToDelete.id,
        [&](bool success, const std::string& error) {
            p_delete.set_value(success);
            expectedError = error;
        }
    );

    bool deleted = f_delete.get();
    ASSERT_TRUE(expectedError.empty());
    ASSERT_TRUE(deleted);

    // Verify user is gone
    std::promise<std::optional<User>> p_get;
    UserService::getInstance()->getUserById(userToDelete.id,
        [&p_get](const std::optional<User>& user, const std::string& err) { p_get.set_value(user); }
    );
    ASSERT_FALSE(p_get.get_future().get().has_value());
}

TEST_F(UserServiceTest, DeleteNonExistentUser) {
    std::promise<bool> p_delete;
    std::future<bool> f_delete = p_delete.get_future();
    std::string expectedError = "";

    UserService::getInstance()->deleteUser("non_existent_uuid",
        [&](bool success, const std::string& error) {
            p_delete.set_value(success);
            expectedError = error;
        }
    );

    bool deleted = f_delete.get();
    ASSERT_FALSE(deleted);
    ASSERT_EQ(expectedError, "Not Found");
}

// Ensure the global test environment is created
// This should be done once in a test driver main() function
// which is usually handled by linking `gtest_main`
// If you run `make` in `test/build`, it will generate `cms_test_runner` executable.
// The `cms_test_runner` will automatically use gtest_main, so you just need to
// register the global environment.
// For this setup with CMake, `add_executable` and linking `GTest::gtest_main`
// correctly sets up the main function to run tests and environments.
// So, only need to call `::testing::AddGlobalTestEnvironment(new DrogonAppFixture());` once.
// This is typically put in a dedicated test_main.cc or similar.
// For direct compilation (not via `gtest_main`), one would uncomment the `int main` block above.
// For now, assume a single test executable.
// A common pattern is to declare a static instance of a class that registers the fixture.
namespace {
    struct GlobalTestSetup {
        GlobalTestSetup() {
            ::testing::AddGlobalTestEnvironment(new DrogonAppFixture());
        }
    };
    GlobalTestSetup globalSetup;
}