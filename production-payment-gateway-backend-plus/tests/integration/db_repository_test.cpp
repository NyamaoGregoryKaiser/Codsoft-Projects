```cpp
#include <catch2/catch_all.hpp>
#include "../../src/database/repositories/user_repository.hpp"
#include "../../src/database/db_connection.hpp"
#include "../../src/models/user.hpp"
#include "../../src/services/user_service.hpp" // For hashing
#include "../../src/utils/logger.hpp" // To ensure logger is initialized for DB ops
#include <pqxx/pqxx>
#include <stdexcept>

// Global setup/teardown for integration tests
// This is not ideal for parallel test runs, but good for simple setups.
// For robust setup, consider Docker Testcontainers or dedicated test DBs.
struct GlobalFixture {
    GlobalFixture() {
        Zenith::Utils::Logger::getLogger(); // Initialize logger
        // Clear test data before running tests
        auto conn = Zenith::Database::DBConnection::getInstance().getConnection();
        pqxx::work W(*conn);
        W.exec("DELETE FROM users WHERE email LIKE 'test.%@%';"); // Clean up test users
        W.exec("DELETE FROM payment_methods WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'test.%@%');");
        W.exec("DELETE FROM transactions WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'test.%@%');");
        W.commit();
        Zenith::Database::DBConnection::getInstance().releaseConnection(conn);
        LOG_INFO("Cleaned up test database.");
    }

    ~GlobalFixture() {
        // Optional: clean up after tests, though usually done before
        auto conn = Zenith::Database::DBConnection::getInstance().getConnection();
        pqxx::work W(*conn);
        W.exec("DELETE FROM users WHERE email LIKE 'test.%@%';");
        W.exec("DELETE FROM payment_methods WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'test.%@%');");
        W.exec("DELETE FROM transactions WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'test.%@%');");
        W.commit();
        Zenith::Database::DBConnection::getInstance().releaseConnection(conn);
        LOG_INFO("Final cleanup of test database.");
    }
};

// This ensures our fixture runs once for all tests in this file
static GlobalFixture globalFixture;

TEST_CASE("UserRepository Integration Tests", "[UserRepository][Integration]") {
    Zenith::Database::UserRepository userRepo;

    // Helper to create a user, ensures clean data
    auto createTestUser = [&](const std::string& email_suffix) {
        Zenith::Models::User user;
        user.username = "testuser_" + email_suffix;
        user.email = "test." + email_suffix + "@example.com";
        user.password_hash = Zenith::Services::Auth::hashPassword("testpass");
        user.full_name = "Test User " + email_suffix;
        user.address = "123 Test St";
        user.phone_number = "555-1234";
        user.role = "customer";
        long id = userRepo.create(user);
        REQUIRE(id > 0);
        user.id = id; // Set the ID from DB
        return user;
    };

    SECTION("Create and Find User") {
        Zenith::Models::User createdUser = createTestUser("create_find");

        auto foundUser = userRepo.findById(createdUser.id);
        REQUIRE(foundUser.has_value());
        REQUIRE(foundUser->username == createdUser.username);
        REQUIRE(foundUser->email == createdUser.email);

        auto foundByEmail = userRepo.findByEmail(createdUser.email);
        REQUIRE(foundByEmail.has_value());
        REQUIRE(foundByEmail->id == createdUser.id);

        auto foundByUsername = userRepo.findByUsername(createdUser.username);
        REQUIRE(foundByUsername.has_value());
        REQUIRE(foundByUsername->id == createdUser.id);
    }

    SECTION("Create User with Duplicate Email/Username Fails") {
        createTestUser("duplicate"); // First user
        Zenith::Models::User duplicateUser = createTestUser("temp");
        duplicateUser.email = "test.duplicate@example.com"; // Try to use duplicate email

        REQUIRE_THROWS_AS(userRepo.create(duplicateUser), pqxx::unique_violation);
        
        duplicateUser.email = "test.another@example.com"; // Reset email
        duplicateUser.username = "testuser_duplicate"; // Try to use duplicate username
        REQUIRE_THROWS_AS(userRepo.create(duplicateUser), pqxx::unique_violation);
    }

    SECTION("Update User") {
        Zenith::Models::User userToUpdate = createTestUser("update");
        userToUpdate.full_name = "Updated Test Name";
        userToUpdate.email = "test.updated@example.com";
        userToUpdate.role = "admin";

        bool updated = userRepo.update(userToUpdate);
        REQUIRE(updated);

        auto retrievedUser = userRepo.findById(userToUpdate.id);
        REQUIRE(retrievedUser.has_value());
        REQUIRE(retrievedUser->full_name == "Updated Test Name");
        REQUIRE(retrievedUser->email == "test.updated@example.com");
        REQUIRE(retrievedUser->role == "admin");
    }

    SECTION("Delete User") {
        Zenith::Models::User userToDelete = createTestUser("delete");

        bool deleted = userRepo.deleteById(userToDelete.id);
        REQUIRE(deleted);

        auto foundUser = userRepo.findById(userToDelete.id);
        REQUIRE_FALSE(foundUser.has_value());
    }

    SECTION("Find All Users") {
        // Ensure a clean state for findAll, or add more distinct users
        int initial_count = userRepo.findAll().size();

        createTestUser("find_all_1");
        createTestUser("find_all_2");

        std::vector<Zenith::Models::User> allUsers = userRepo.findAll();
        REQUIRE(allUsers.size() >= initial_count + 2); // Check against potential existing data
    }
}
```