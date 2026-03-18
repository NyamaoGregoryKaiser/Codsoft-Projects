#include <catch2/catch_test_macros.hpp>
#include "services/UserService.h"
#include "database/DatabaseManager.h"
#include "common/ErrorHandling.h"
#include "models/User.h" // For UUID generation

TEST_CASE("UserService integration with DatabaseManager", "[UserService][Database]") {
    UserService user_service;
    DatabaseManager& db_manager = DatabaseManager::getInstance();

    // Clear users table before each test section to ensure isolation
    db_manager.execute("DELETE FROM users;");

    SECTION("User creation persists in database and can be retrieved") {
        std::string username = "db_user";
        std::string email = "db_user@example.com";
        std::string password = "db_password";

        User created_user = user_service.createUser(username, email, password);

        // Verify direct database retrieval
        std::string retrieved_email;
        db_manager.getDb() << "SELECT email FROM users WHERE id = ?;" << created_user.id >> retrieved_email;
        REQUIRE(retrieved_email == email);

        // Verify retrieval by service methods
        std::optional<User> user_by_id = user_service.getUserById(created_user.id);
        REQUIRE(user_by_id.has_value());
        REQUIRE(user_by_id->username == username);
        REQUIRE(user_by_id->email == email);

        std::optional<User> user_by_email = user_service.getUserByEmail(email);
        REQUIRE(user_by_email.has_value());
        REQUIRE(user_by_email->username == username);
        REQUIRE(user_by_email->id == created_user.id);
    }

    SECTION("Attempting to create user with duplicate email throws BadRequestError") {
        std::string username1 = "firstuser";
        std::string email = "duplicate@example.com";
        std::string password = "pass1";
        user_service.createUser(username1, email, password);

        std::string username2 = "seconduser";
        REQUIRE_THROWS_AS(user_service.createUser(username2, email, "pass2"), BadRequestError);
    }
}
```