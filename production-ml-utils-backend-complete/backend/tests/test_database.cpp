#include <catch2/catch_test_macros.hpp>
#include "database/DatabaseManager.h"
#include "models/User.h" // For UUID generation
#include <vector>
#include <string>

TEST_CASE("DatabaseManager initializes and runs migrations", "[DatabaseManager]") {
    DatabaseManager& db_manager = DatabaseManager::getInstance();

    SECTION("Database is connected and basic tables exist") {
        // Check if users table exists
        int count = 0;
        db_manager.getDb() << "SELECT count(*) FROM sqlite_master WHERE type='table' AND name='users';" >> count;
        REQUIRE(count == 1);

        // Check if models table exists
        count = 0;
        db_manager.getDb() << "SELECT count(*) FROM sqlite_master WHERE type='table' AND name='models';" >> count;
        REQUIRE(count == 1);

        // Check if migrations table exists
        count = 0;
        db_manager.getDb() << "SELECT count(*) FROM sqlite_master WHERE type='table' AND name='migrations';" >> count;
        REQUIRE(count == 1);
    }

    SECTION("Insert and retrieve data from users table") {
        std::string user_id = UUID::generate_uuid_v4();
        std::string username = "testuser";
        std::string email = "test@example.com";
        std::string password_hash = "hashed_password";

        db_manager.getDb() << "INSERT INTO users (id, username, email, password_hash) VALUES (?, ?, ?, ?);"
            << user_id << username << email << password_hash;

        std::string retrieved_username;
        db_manager.getDb() << "SELECT username FROM users WHERE id = ?;" << user_id >> retrieved_username;
        REQUIRE(retrieved_username == username);
    }

    SECTION("Insert and retrieve data from models table with foreign key") {
        std::string user_id = UUID::generate_uuid_v4();
        std::string username = "modeluser";
        std::string email = "model@example.com";
        std::string password_hash = "model_hash";
        db_manager.getDb() << "INSERT INTO users (id, username, email, password_hash) VALUES (?, ?, ?, ?);"
            << user_id << username << email << password_hash;

        std::string model_id = UUID::generate_uuid_v4();
        std::string model_name = "test_model";
        std::string description = "A test ML model.";
        std::string version = "1.0";
        std::string model_path = "/path/to/model.pkl";
        std::string status = "draft";
        std::string metadata = "{\"accuracy\": 0.9}";

        db_manager.getDb() << "INSERT INTO models (id, user_id, name, description, version, model_path, status, metadata) VALUES (?, ?, ?, ?, ?, ?, ?, ?);"
            << model_id << user_id << model_name << description << version << model_path << status << metadata;

        std::string retrieved_model_name;
        db_manager.getDb() << "SELECT name FROM models WHERE id = ?;" << model_id >> retrieved_model_name;
        REQUIRE(retrieved_model_name == model_name);

        // Test foreign key constraint (if ON DELETE CASCADE is set, deleting user should delete model)
        db_manager.getDb() << "DELETE FROM users WHERE id = ?;" << user_id;
        int model_count = 0;
        db_manager.getDb() << "SELECT COUNT(*) FROM models WHERE id = ?;" << model_id >> model_count;
        REQUIRE(model_count == 0);
    }

    SECTION("Test `execute` method") {
        std::string test_user_id = UUID::generate_uuid_v4();
        db_manager.execute("INSERT INTO users (id, username, email, password_hash) VALUES (?, ?, ?, ?);",
                           [&](sqlite::database_binder& binder) {
                               binder << test_user_id << "exec_user" << "exec@test.com" << "exec_hash";
                           });
        std::string retrieved_email;
        db_manager.getDb() << "SELECT email FROM users WHERE id = ?;" << test_user_id >> retrieved_email;
        REQUIRE(retrieved_email == "exec@test.com");
    }
}
```