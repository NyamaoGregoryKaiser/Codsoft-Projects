```cpp
#include <gtest/gtest.h>
#include "core/models/User.h"
#include <nlohmann/json.hpp>

// Test default constructor
TEST(UserTest, DefaultConstructor) {
    User user;
    ASSERT_FALSE(user.id.has_value());
    ASSERT_TRUE(user.username.empty());
    ASSERT_TRUE(user.email.empty());
    ASSERT_TRUE(user.password_hash.empty());
    ASSERT_TRUE(user.created_at.empty());
    ASSERT_TRUE(user.updated_at.empty());
}

// Test parameterized constructor
TEST(UserTest, ParameterizedConstructor) {
    User user(1, "testuser", "test@example.com", "hashedpass", "2023-01-01T00:00:00Z", "2023-01-01T00:00:00Z");
    ASSERT_EQ(user.id, 1);
    ASSERT_EQ(user.username, "testuser");
    ASSERT_EQ(user.email, "test@example.com");
    ASSERT_EQ(user.password_hash, "hashedpass");
    ASSERT_EQ(user.created_at, "2023-01-01T00:00:00Z");
    ASSERT_EQ(user.updated_at, "2023-01-01T00:00:00Z");
}

// Test toJson() method
TEST(UserTest, ToJson) {
    User user(1, "testuser", "test@example.com", "hashedpass", "2023-01-01T00:00:00Z", "2023-01-01T00:00:00Z");
    nlohmann::json j = user.toJson();

    ASSERT_EQ(j["id"], 1);
    ASSERT_EQ(j["username"], "testuser");
    ASSERT_EQ(j["email"], "test@example.com");
    ASSERT_FALSE(j.contains("password_hash")); // Should not include password_hash
    ASSERT_EQ(j["created_at"], "2023-01-01T00:00:00Z");
    ASSERT_EQ(j["updated_at"], "2023-01-01T00:00:00Z");
}

// Test fromJson() method
TEST(UserTest, FromJson) {
    nlohmann::json j = {
        {"id", 2},
        {"username", "newuser"},
        {"email", "new@example.com"},
        {"password", "plaintextpass"} // This field is typically for AuthService, not stored directly
    };

    User user = User::fromJson(j);
    ASSERT_EQ(user.id, 2);
    ASSERT_EQ(user.username, "newuser");
    ASSERT_EQ(user.email, "new@example.com");
    // password_hash is not set by fromJson, it's handled by AuthService
    ASSERT_TRUE(user.password_hash.empty());
    ASSERT_TRUE(user.created_at.empty());
    ASSERT_TRUE(user.updated_at.empty());
}

// Test fromJson() without optional ID
TEST(UserTest, FromJsonNoId) {
    nlohmann::json j = {
        {"username", "no_id_user"},
        {"email", "no_id@example.com"}
    };

    User user = User::fromJson(j);
    ASSERT_FALSE(user.id.has_value());
    ASSERT_EQ(user.username, "no_id_user");
    ASSERT_EQ(user.email, "no_id@example.com");
}
```