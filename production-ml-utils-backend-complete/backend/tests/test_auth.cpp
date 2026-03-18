#include <catch2/catch_test_macros.hpp>
#include "services/UserService.h"
#include "config/AppConfig.h" // To get JWT secret

// Mocking some external dependencies for AuthController if needed,
// but here we're directly testing UserService functions.

TEST_CASE("UserService password hashing and verification", "[UserService][Auth]") {
    UserService user_service;

    SECTION("Password hashing works (mocked)") {
        std::string password = "mysecurepassword";
        std::string hashed_password = user_service.hashPassword(password);
        REQUIRE(hashed_password == "mock_hash_mysecurepassword"); // Based on mock implementation
    }

    SECTION("Password verification works (mocked)") {
        std::string password = "anotherpassword";
        std::string hashed_password = user_service.hashPassword(password);
        REQUIRE(user_service.verifyPassword(password, hashed_password) == true);
    }

    SECTION("Incorrect password verification fails") {
        std::string password = "correctpassword";
        std::string wrong_password = "wrongpassword";
        std::string hashed_password = user_service.hashPassword(password);
        REQUIRE(user_service.verifyPassword(wrong_password, hashed_password) == false);
    }
}

TEST_CASE("UserService user creation and retrieval", "[UserService][Auth]") {
    UserService user_service;
    // Clear users table before each test section to ensure isolation
    DatabaseManager::getInstance().execute("DELETE FROM users;");

    SECTION("User can be created successfully") {
        User new_user = user_service.createUser("john_doe", "john@example.com", "securepass");
        REQUIRE_FALSE(new_user.id.empty());
        REQUIRE(new_user.username == "john_doe");
        REQUIRE(new_user.email == "john@example.com");

        std::optional<User> retrieved_user = user_service.getUserById(new_user.id);
        REQUIRE(retrieved_user.has_value());
        REQUIRE(retrieved_user->email == "john@example.com");
    }

    SECTION("Creating user with existing email fails") {
        user_service.createUser("jane_doe", "jane@example.com", "pass123");
        REQUIRE_THROWS_AS(user_service.createUser("jane_smith", "jane@example.com", "pass456"), BadRequestError);
    }

    SECTION("Retrieving non-existent user returns empty optional") {
        std::optional<User> user_by_email = user_service.getUserByEmail("nonexistent@example.com");
        REQUIRE_FALSE(user_by_email.has_value());

        std::optional<User> user_by_id = user_service.getUserById(UUID::generate_uuid_v4()); // Random UUID
        REQUIRE_FALSE(user_by_id.has_value());
    }
}

// NOTE: Testing `AuthController` directly would require mocking `crow::request` and `crow::response`
// and potentially the JWT generation/verification, which is more complex for unit tests.
// The current setup tests the underlying `UserService` which provides most of the business logic.
// For API-level testing, integration tests (e.g., with `curl` or a test client) would be more appropriate.
```