```cpp
#include "gtest/gtest.h"
#include "db/UserRepository.h"
#include "db/Database.h"
#include "utils/PasswordHasher.h"
#include "utils/Logger.h" // Include for logging in tests

// Fixture for UserRepository tests
class UserRepositoryTest : public ::testing::Test {
protected:
    UserRepository user_repo;

    // Set up method, called before each test
    void SetUp() override {
        // Ensure database is clean before each test
        // In a real project, this would involve a test-specific database or transaction rollback
        // For simplicity, we'll delete a known test user if exists
        LOG_INFO("Setting up UserRepositoryTest...");
        try {
            pqxx::work w(Database::get_instance().get_connection());
            w.exec("DELETE FROM users WHERE username = 'testuser' OR username = 'updatedtestuser';");
            w.commit();
        } catch (const std::exception& e) {
            LOG_ERROR("Error during test setup: {}", e.what());
            FAIL() << "Database setup failed: " << e.what();
        }
    }

    // Tear down method, called after each test
    void TearDown() override {
        // Clean up any test data
        LOG_INFO("Tearing down UserRepositoryTest...");
        try {
            pqxx::work w(Database::get_instance().get_connection());
            w.exec("DELETE FROM users WHERE username = 'testuser' OR username = 'updatedtestuser';");
            w.commit();
        } catch (const std::exception& e) {
            LOG_ERROR("Error during test teardown: {}", e.what());
            // Do not fail here, teardown should be robust
        }
    }
};

// Test case for Create User
TEST_F(UserRepositoryTest, CreateUserSuccessfully) {
    User test_user;
    test_user.username = "testuser";
    test_user.email = "test@example.com";
    test_user.password_hash = PasswordHasher::create_password_hash("testpassword");

    long user_id = user_repo.create_user(test_user);
    ASSERT_GT(user_id, 0); // Expect a positive ID for successful creation

    auto created_user = user_repo.find_by_id(user_id);
    ASSERT_TRUE(created_user.has_value());
    EXPECT_EQ(created_user->username, "testuser");
    EXPECT_EQ(created_user->email, "test@example.com");
    // Don't compare password hash directly, as salt is random. Verify via helper.
    EXPECT_TRUE(PasswordHasher::verify_password("testpassword", created_user->password_hash));
}

// Test case for finding user by username
TEST_F(UserRepositoryTest, FindUserByUsername) {
    User test_user;
    test_user.username = "testuser";
    test_user.email = "test@example.com";
    test_user.password_hash = PasswordHasher::create_password_hash("testpassword");
    user_repo.create_user(test_user);

    auto found_user = user_repo.find_by_username("testuser");
    ASSERT_TRUE(found_user.has_value());
    EXPECT_EQ(found_user->email, "test@example.com");
}

// Test case for finding non-existent user
TEST_F(UserRepositoryTest, FindNonExistentUser) {
    auto found_user_id = user_repo.find_by_id(99999);
    ASSERT_FALSE(found_user_id.has_value());

    auto found_user_username = user_repo.find_by_username("nonexistent");
    ASSERT_FALSE(found_user_username.has_value());
}

// Test case for updating user
TEST_F(UserRepositoryTest, UpdateUser) {
    User test_user;
    test_user.username = "testuser";
    test_user.email = "test@example.com";
    test_user.password_hash = PasswordHasher::create_password_hash("testpassword");
    long user_id = user_repo.create_user(test_user);

    ASSERT_GT(user_id, 0);

    test_user.id = user_id;
    test_user.username = "updatedtestuser";
    test_user.email = "updated@example.com";
    test_user.password_hash = PasswordHasher::create_password_hash("newpassword");

    bool updated = user_repo.update_user(test_user);
    ASSERT_TRUE(updated);

    auto updated_user = user_repo.find_by_id(user_id);
    ASSERT_TRUE(updated_user.has_value());
    EXPECT_EQ(updated_user->username, "updatedtestuser");
    EXPECT_EQ(updated_user->email, "updated@example.com");
    EXPECT_TRUE(PasswordHasher::verify_password("newpassword", updated_user->password_hash));
}

// Test case for deleting user
TEST_F(UserRepositoryTest, DeleteUser) {
    User test_user;
    test_user.username = "testuser";
    test_user.email = "test@example.com";
    test_user.password_hash = PasswordHasher::create_password_hash("testpassword");
    long user_id = user_repo.create_user(test_user);

    ASSERT_GT(user_id, 0);

    bool deleted = user_repo.delete_user(user_id);
    ASSERT_TRUE(deleted);

    auto found_user = user_repo.find_by_id(user_id);
    ASSERT_FALSE(found_user.has_value());
}

// Global main function for GTest (if not using gtest_main)
// int main(int argc, char **argv) {
//     Logger::get_logger(); // Initialize logger for tests
//     ::testing::InitGoogleTest(&argc, argv);
//     return RUN_ALL_TESTS();
// }
```