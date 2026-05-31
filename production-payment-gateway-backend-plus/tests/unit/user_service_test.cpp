```cpp
#define CATCH_CONFIG_MAIN // This tells Catch to provide a main() - only do this in one cpp file
#include <catch2/catch_all.hpp>
#include "../../src/services/user_service.hpp"
#include "../../src/database/repositories/user_repository.hpp"
#include "../../src/models/user.hpp"
#include <optional>
#include <stdexcept>
#include <chrono>

// Mock UserRepository for unit testing UserService in isolation
class MockUserRepository : public Zenith::Database::UserRepository {
public:
    std::vector<Zenith::Models::User> users;
    long next_id = 1;

    std::optional<Zenith::Models::User> findById(long id) override {
        for (const auto& user : users) {
            if (user.id == id) {
                return user;
            }
        }
        return std::nullopt;
    }

    std::optional<Zenith::Models::User> findByEmail(const std::string& email) override {
        for (const auto& user : users) {
            if (user.email == email) {
                return user;
            }
        }
        return std::nullopt;
    }

    std::optional<Zenith::Models::User> findByUsername(const std::string& username) override {
        for (const auto& user : users) {
            if (user.username == username) {
                return user;
            }
        }
        return std::nullopt;
    }

    std::vector<Zenith::Models::User> findAll() override {
        return users;
    }

    long create(const Zenith::Models::User& user) override {
        Zenith::Models::User new_user = user;
        new_user.id = next_id++;
        new_user.created_at = std::chrono::system_clock::now();
        new_user.updated_at = new_user.created_at;
        users.push_back(new_user);
        return new_user.id;
    }

    bool update(const Zenith::Models::User& user) override {
        for (auto& u : users) {
            if (u.id == user.id) {
                u = user;
                u.updated_at = std::chrono::system_clock::now();
                return true;
            }
        }
        return false;
    }

    bool deleteById(long id) override {
        auto it = std::remove_if(users.begin(), users.end(), [&](const Zenith::Models::User& u) {
            return u.id == id;
        });
        if (it != users.end()) {
            users.erase(it, users.end());
            return true;
        }
        return false;
    }
};

TEST_CASE("UserService Basic Operations", "[UserService][Unit]") {
    MockUserRepository mockRepo;
    Zenith::Services::UserService userService(mockRepo);

    SECTION("Create User") {
        long userId = userService.createUser("testuser", "test@example.com", "password123", "Test User", "123 Test St", "555-0000", "customer");
        REQUIRE(userId > 0);
        auto user = userService.getUserById(userId);
        REQUIRE(user.has_value());
        REQUIRE(user->username == "testuser");
        REQUIRE(user->email == "test@example.com");
        REQUIRE(user->role == "customer");
    }

    SECTION("Create Duplicate User (Email)") {
        userService.createUser("user1", "duplicate@example.com", "pass1", "User One", "Addr1", "1", "customer");
        REQUIRE_THROWS_WITH(userService.createUser("user2", "duplicate@example.com", "pass2", "User Two", "Addr2", "2", "customer"),
                            "User with this email already exists.");
    }

    SECTION("Create Duplicate User (Username)") {
        userService.createUser("duplicate_username", "email1@example.com", "pass1", "User One", "Addr1", "1", "customer");
        REQUIRE_THROWS_WITH(userService.createUser("duplicate_username", "email2@example.com", "pass2", "User Two", "Addr2", "2", "customer"),
                            "User with this username already exists.");
    }

    SECTION("Get User By ID, Email, Username") {
        long userId = userService.createUser("findme", "findme@example.com", "pass", "Find Me", "Loc", "999", "customer");
        auto userById = userService.getUserById(userId);
        REQUIRE(userById.has_value());
        REQUIRE(userById->email == "findme@example.com");

        auto userByEmail = userService.getUserByEmail("findme@example.com");
        REQUIRE(userByEmail.has_value());
        REQUIRE(userByEmail->id == userId);

        auto userByUsername = userService.getUserByUsername("findme");
        REQUIRE(userByUsername.has_value());
        REQUIRE(userByUsername->id == userId);

        REQUIRE_FALSE(userService.getUserById(999).has_value());
    }

    SECTION("Authenticate User") {
        long userId = userService.createUser("authuser", "auth@example.com", "correctpassword", "Auth User", "", "", "customer");
        auto authenticatedUser = userService.authenticateUser("auth@example.com", "correctpassword");
        REQUIRE(authenticatedUser.has_value());
        REQUIRE(authenticatedUser->id == userId);

        REQUIRE_FALSE(userService.authenticateUser("auth@example.com", "wrongpassword").has_value());
        REQUIRE_FALSE(userService.authenticateUser("nonexistent@example.com", "password").has_value());
    }

    SECTION("Update User") {
        long userId = userService.createUser("oldname", "old@example.com", "oldpass", "Old Name", "Old Addr", "Old Phone", "customer");
        auto userToUpdate = userService.getUserById(userId).value();

        userToUpdate.username = "newname";
        userToUpdate.email = "new@example.com";
        // Password hash would typically be re-hashed if password changes. For mock, just assign.
        userToUpdate.password_hash = Zenith::Services::Auth::hashPassword("newpass");
        userToUpdate.full_name = "New Name";
        userToUpdate.role = "admin";

        bool updated = userService.updateUser(userToUpdate.id, userToUpdate.username, userToUpdate.email,
                                             userToUpdate.password_hash, userToUpdate.full_name,
                                             userToUpdate.address, userToUpdate.phone_number, userToUpdate.role);
        REQUIRE(updated);

        auto updatedUser = userService.getUserById(userId);
        REQUIRE(updatedUser.has_value());
        REQUIRE(updatedUser->username == "newname");
        REQUIRE(updatedUser->email == "new@example.com");
        REQUIRE(Zenith::Services::Auth::verifyPassword("newpass", updatedUser->password_hash));
        REQUIRE(updatedUser->role == "admin");
    }

    SECTION("Delete User") {
        long userId1 = userService.createUser("deluser1", "del1@example.com", "pass1", "Del User 1", "", "", "customer");
        long userId2 = userService.createUser("deluser2", "del2@example.com", "pass2", "Del User 2", "", "", "customer");

        REQUIRE(userService.deleteUser(userId1));
        REQUIRE_FALSE(userService.getUserById(userId1).has_value());
        REQUIRE(userService.getUserById(userId2).has_value()); // Other user should still exist
        REQUIRE_FALSE(userService.deleteUser(999)); // Delete non-existent user
    }
}
```