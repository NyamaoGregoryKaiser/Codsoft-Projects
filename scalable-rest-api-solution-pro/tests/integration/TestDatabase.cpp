```cpp
#include <gtest/gtest.h>
#include "core/database/DatabaseManager.h"
#include "core/models/User.h"
#include "core/models/Project.h"
#include "core/models/Task.h"
#include "app/services/AuthService.h"
#include "core/utils/Logger.h"
#include "core/utils/Config.h"
#include <chrono>
#include <iomanip>
#include <sstream>

// Integration tests for DatabaseManager and basic CRUD operations
class DatabaseIntegrationTest : public ::testing::Test {
protected:
    void SetUp() override {
        // Initialize config and logger once
        static bool initialized = false;
        if (!initialized) {
            Config::load("config.json");
            Logger::init(Config::get("log_config_path", "config/log_config.json"));
            initialized = true;
        }

        // Initialize SQLite in-memory database for testing
        DatabaseManager::init("sqlite3::memory:");

        // Apply schema migrations
        DatabaseManager::execute(
            "CREATE TABLE users ("
            "id INTEGER PRIMARY KEY AUTOINCREMENT, username VARCHAR(255) NOT NULL UNIQUE, "
            "email VARCHAR(255) NOT NULL UNIQUE, password_hash VARCHAR(255) NOT NULL, "
            "created_at TEXT, updated_at TEXT);"
        );
        DatabaseManager::execute(
            "CREATE TABLE projects ("
            "id INTEGER PRIMARY KEY AUTOINCREMENT, name VARCHAR(255) NOT NULL, "
            "description TEXT, owner_id INTEGER NOT NULL, "
            "created_at TEXT, updated_at TEXT, "
            "FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE);"
        );
        DatabaseManager::execute(
            "CREATE TABLE tasks ("
            "id INTEGER PRIMARY KEY AUTOINCREMENT, title VARCHAR(255) NOT NULL, "
            "description TEXT, project_id INTEGER NOT NULL, assigned_user_id INTEGER NOT NULL, "
            "status VARCHAR(50) NOT NULL DEFAULT 'OPEN', due_date TEXT, "
            "created_at TEXT, updated_at TEXT, "
            "FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE, "
            "FOREIGN KEY (assigned_user_id) REFERENCES users(id) ON DELETE CASCADE);"
        );
    }

    void TearDown() override {
        // In-memory database is reset for each test suite, so no specific tear-down for data needed.
    }
};

TEST_F(DatabaseIntegrationTest, UserCrudOperations) {
    soci::session& sql = DatabaseManager::getSession();

    // C - Create User
    User user_to_create;
    user_to_create.username = "db_test_user";
    user_to_create.email = "db_test@example.com";
    user_to_create.password_hash = AuthService::hashPassword("db_password");
    user_to_create.created_at = "2023-01-01T00:00:00Z";
    user_to_create.updated_at = "2023-01-01T00:00:00Z";

    long long new_user_id;
    sql << "INSERT INTO users (username, email, password_hash, created_at, updated_at) VALUES (:username, :email, :password_hash, :created_at, :updated_at) RETURNING id",
        soci::use(user_to_create.username), soci::use(user_to_create.email), soci::use(user_to_create.password_hash),
        soci::use(user_to_create.created_at), soci::use(user_to_create.updated_at),
        soci::into(new_user_id);
    
    ASSERT_GT(new_user_id, 0);
    user_to_create.id = new_user_id;

    // R - Read User
    User fetched_user;
    std::string fetched_password_hash;
    long long fetched_id;
    sql << "SELECT id, username, email, password_hash, created_at, updated_at FROM users WHERE id = :id",
        soci::into(fetched_id), soci::into(fetched_user.username), soci::into(fetched_user.email),
        soci::into(fetched_password_hash), soci::into(fetched_user.created_at), soci::into(fetched_user.updated_at),
        soci::use(new_user_id);
    
    fetched_user.id = fetched_id;
    fetched_user.password_hash = fetched_password_hash; // Assign hash for comparison

    ASSERT_EQ(fetched_user.id, user_to_create.id);
    ASSERT_EQ(fetched_user.username, user_to_create.username);
    ASSERT_EQ(fetched_user.email, user_to_create.email);
    ASSERT_EQ(fetched_user.password_hash, user_to_create.password_hash);

    // U - Update User
    std::string updated_username = "updated_db_test_user";
    std::string updated_email = "updated_db_test@example.com";
    std::string updated_at_str = "2023-01-02T00:00:00Z";

    int rows_affected = 0;
    sql << "UPDATE users SET username = :username, email = :email, updated_at = :updated_at WHERE id = :id",
        soci::use(updated_username), soci::use(updated_email), soci::use(updated_at_str), soci::use(new_user_id),
        soci::into(rows_affected);
    
    ASSERT_EQ(rows_affected, 1);

    // Verify update
    sql << "SELECT username, email, updated_at FROM users WHERE id = :id",
        soci::into(fetched_user.username), soci::into(fetched_user.email), soci::into(fetched_user.updated_at),
        soci::use(new_user_id);
    
    ASSERT_EQ(fetched_user.username, updated_username);
    ASSERT_EQ(fetched_user.email, updated_email);
    ASSERT_EQ(fetched_user.updated_at, updated_at_str);

    // D - Delete User
    rows_affected = 0;
    sql << "DELETE FROM users WHERE id = :id", soci::use(new_user_id), soci::into(rows_affected);
    ASSERT_EQ(rows_affected, 1);

    // Verify deletion
    int count = 0;
    sql << "SELECT COUNT(*) FROM users WHERE id = :id", soci::into(count), soci::use(new_user_id);
    ASSERT_EQ(count, 0);
}
```