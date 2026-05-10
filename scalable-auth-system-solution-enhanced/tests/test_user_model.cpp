```cpp
#include <gtest/gtest.h>
#include "../models/User.h"
#include "../database/Database.h"
#include "../utils/Logger.h"

class UserModelTest : public ::testing::Test {
protected:
    std::shared_ptr<Database> db;
    std::string test_user_id;

    void SetUp() override {
        db = std::make_shared<Database>(":memory:");
        db->open();
        db->execute(
            "CREATE TABLE IF NOT EXISTS users ("
            "id TEXT PRIMARY KEY NOT NULL,"
            "username TEXT NOT NULL,"
            "email TEXT UNIQUE NOT NULL,"
            "password_hash TEXT NOT NULL,"
            "created_at TEXT DEFAULT CURRENT_TIMESTAMP,"
            "updated_at TEXT DEFAULT CURRENT_TIMESTAMP,"
            "is_deleted INTEGER DEFAULT 0"
            ");"
        );
        test_user_id = User::generateUuid();
    }

    void TearDown() override {
        db->close();
    }
};

TEST_F(UserModelTest, CreateUserSuccess) {
    User user(db);
    user.setUsername("testuser");
    user.setEmail("test@example.com");
    user.setPasswordHash("hashed_password");

    ASSERT_TRUE(user.create());
    ASSERT_FALSE(user.getId().empty());

    // Verify user exists in DB
    std::map<std::string, std::string> row = db->querySingle("SELECT username, email, password_hash FROM users WHERE id = ?;", {user.getId()});
    ASSERT_FALSE(row.empty());
    ASSERT_EQ(row["username"], "testuser");
    ASSERT_EQ(row["email"], "test@example.com");
    ASSERT_EQ(row["password_hash"], "hashed_password");
}

TEST_F(UserModelTest, CreateUserDuplicateEmailFails) {
    User user1(db);
    user1.setUsername("user1");
    user1.setEmail("duplicate@example.com");
    user1.setPasswordHash("hash1");
    ASSERT_TRUE(user1.create());

    User user2(db);
    user2.setUsername("user2");
    user2.setEmail("duplicate@example.com"); // Same email
    user2.setPasswordHash("hash2");

    ASSERT_THROW(user2.create(), UserException); // Should throw UserException due to duplicate email
}

TEST_F(UserModelTest, FindByIdSuccess) {
    User user(db);
    user.setUsername("findme");
    user.setEmail("findme@example.com");
    user.setPasswordHash("hash_findme");
    user.create();

    User foundUser(db);
    ASSERT_TRUE(foundUser.findById(user.getId()));
    ASSERT_EQ(foundUser.getUsername(), "findme");
    ASSERT_EQ(foundUser.getEmail(), "findme@example.com");
}

TEST_F(UserModelTest, FindByIdNotFound) {
    User foundUser(db);
    ASSERT_FALSE(foundUser.findById(User::generateUuid())); // Non-existent ID
}

TEST_F(UserModelTest, FindByEmailSuccess) {
    User user(db);
    user.setUsername("findbyemail");
    user.setEmail("email_search@example.com");
    user.setPasswordHash("hash_email");
    user.create();

    User foundUser(db);
    ASSERT_TRUE(foundUser.findByEmail("email_search@example.com"));
    ASSERT_EQ(foundUser.getUsername(), "findbyemail");
    ASSERT_EQ(foundUser.getId(), user.getId());
}

TEST_F(UserModelTest, FindByEmailNotFound) {
    User foundUser(db);
    ASSERT_FALSE(foundUser.findByEmail("nonexistent@example.com"));
}

TEST_F(UserModelTest, UpdateUserSuccess) {
    User user(db);
    user.setUsername("old_name");
    user.setEmail("old@example.com");
    user.setPasswordHash("old_hash");
    user.create();

    user.setUsername("new_name");
    user.setEmail("new@example.com");
    user.setPasswordHash("new_hash");

    ASSERT_TRUE(user.update());

    User updatedUser(db);
    updatedUser.findById(user.getId());
    ASSERT_EQ(updatedUser.getUsername(), "new_name");
    ASSERT_EQ(updatedUser.getEmail(), "new@example.com");
    ASSERT_EQ(updatedUser.getPasswordHash(), "new_hash");
}

TEST_F(UserModelTest, UpdateUserDuplicateEmailFails) {
    User user1(db);
    user1.setUsername("user1");
    user1.setEmail("unique1@example.com");
    user1.setPasswordHash("hash1");
    user1.create();

    User user2(db);
    user2.setUsername("user2");
    user2.setEmail("unique2@example.com");
    user2.setPasswordHash("hash2");
    user2.create();

    // Try to update user1's email to user2's email
    user1.setEmail("unique2@example.com");
    ASSERT_THROW(user1.update(), UserException);
}

TEST_F(UserModelTest, SoftDeleteUser) {
    User user(db);
    user.setUsername("todelete");
    user.setEmail("todelete@example.com");
    user.setPasswordHash("hash");
    user.create();

    ASSERT_FALSE(user.getIsDeleted());
    ASSERT_TRUE(user.softDelete());
    ASSERT_TRUE(user.getIsDeleted());

    // Verify in DB that is_deleted is 1
    std::map<std::string, std::string> row = db->querySingle("SELECT is_deleted FROM users WHERE id = ?;", {user.getId()});
    ASSERT_FALSE(row.empty());
    ASSERT_EQ(row["is_deleted"], "1");

    // findById should not find soft-deleted users
    User foundUser(db);
    ASSERT_FALSE(foundUser.findById(user.getId()));
}

TEST_F(UserModelTest, GenerateUuidReturnsValidString) {
    std::string uuid = User::generateUuid();
    ASSERT_FALSE(uuid.empty());
    // Basic UUID format check: 36 characters (e.g., xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx)
    ASSERT_EQ(uuid.length(), 36);
    ASSERT_EQ(uuid[8], '-');
    ASSERT_EQ(uuid[13], '-');
    ASSERT_EQ(uuid[18], '-');
    ASSERT_EQ(uuid[23], '-');
}
```