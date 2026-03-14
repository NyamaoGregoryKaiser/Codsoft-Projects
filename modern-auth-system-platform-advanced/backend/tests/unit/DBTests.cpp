#include <gtest/gtest.h>
#include "../../src/database/DBManager.h"
#include "../../src/models/User.h"
#include "../../src/config/Config.h" // To get DB connection info
#include "../../src/logger/Logger.h" // For logger initialization
#include "../../src/utils/PasswordHasher.h" // For hashing passwords before DB insert

// Global setup for DBManager and Config (similar to AuthTests)
struct GlobalDBTestEnvironment : public ::testing::Environment {
    void SetUp() override {
        Logger::init();
        // Set up minimal config for tests that need DB connection details
#ifdef _WIN32
        _putenv_s("DB_HOST", "localhost");
        _putenv_s("DB_PORT", "5432");
        _putenv_s("DB_USER", "authuser"); // Use same user as docker-compose for convenience
        _putenv_s("DB_PASSWORD", "authpassword");
        _putenv_s("DB_NAME", "authdb_test"); // Use a separate database for testing
        _putenv_s("JWT_SECRET", "test_access_secret_123"); // Dummy for config load
        _putenv_s("JWT_REFRESH_SECRET", "test_refresh_secret_456"); // Dummy for config load
        _putenv_s("JWT_ACCESS_TOKEN_EXPIRATION_MINUTES", "1");
        _putenv_s("JWT_REFRESH_TOKEN_EXPIRATION_MINUTES", "10");
        _putenv_s("HTTP_PORT", "8080");
        _putenv_s("RATE_LIMIT_MAX_REQUESTS", "10");
        _putenv_s("RATE_LIMIT_WINDOW_SECONDS", "60");
#else
        setenv("DB_HOST", "localhost", 1);
        setenv("DB_PORT", "5432", 1);
        setenv("DB_USER", "authuser", 1);
        setenv("DB_PASSWORD", "authpassword", 1);
        setenv("DB_NAME", "authdb_test", 1);
        setenv("JWT_SECRET", "test_access_secret_123", 1);
        setenv("JWT_REFRESH_SECRET", "test_refresh_secret_456", 1);
        setenv("JWT_ACCESS_TOKEN_EXPIRATION_MINUTES", "1", 1);
        setenv("JWT_REFRESH_TOKEN_EXPIRATION_MINUTES", "10", 1);
        setenv("HTTP_PORT", "8080", 1);
        setenv("RATE_LIMIT_MAX_REQUESTS", "10", 1);
        setenv("RATE_LIMIT_WINDOW_SECONDS", "60", 1);
#endif
        Config::load(".env.test"); // Try to load from a dummy test env file, will fallback to setenv if not found

        // Construct connection string from Config
        std::string connInfo = "host=" + Config::getDbHost() +
                               " port=" + Config::getDbPort() +
                               " user=" + Config::getDbUser() +
                               " password=" + Config::getDbPassword() +
                               " dbname=" + Config::getDbName();
        
        // Connect to the test database
        try {
            DBManager::getInstance().connect(connInfo);
            Logger::getLogger()->info("Connected to test database for DBManager tests.");

            // Ensure a clean state for the users table
            pqxx::work W(*DBManager::getInstance().conn); // Access internal connection for setup
            W.exec("DROP TABLE IF EXISTS users CASCADE;"); // Cascade to drop related triggers/functions
            W.exec("CREATE TABLE users (id SERIAL PRIMARY KEY, username VARCHAR(255) UNIQUE NOT NULL, password_hash VARCHAR(255) NOT NULL, role VARCHAR(50) NOT NULL DEFAULT 'USER', created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP);");
            W.exec("CREATE UNIQUE INDEX idx_users_username ON users (username);");
            W.exec("CREATE OR REPLACE FUNCTION update_timestamp() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;");
            W.exec("CREATE OR REPLACE TRIGGER update_users_timestamp BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_timestamp();");
            W.exec("ALTER TABLE users ADD CONSTRAINT chk_users_role CHECK (role IN ('USER', 'ADMIN'));");
            W.commit();
            Logger::getLogger()->info("Test database users table reset.");

        } catch (const pqxx::broken_connection& e) {
            Logger::getLogger()->critical("Database connection broken during setup: {}. Is PostgreSQL running and accessible?", e.what());
            // Fail fast if connection is broken
            exit(1); 
        } catch (const std::exception& e) {
            Logger::getLogger()->critical("DBManager test setup failed: {}", e.what());
            exit(1);
        }
    }

    void TearDown() override {
        DBManager::getInstance().disconnect();
        Logger::getLogger()->info("Disconnected from test database.");
    }
};

[[maybe_unused]] testing::Environment* const db_env = testing::AddGlobalTestEnvironment(new GlobalDBTestEnvironment);


// Test fixture for cleaning up after each test
class DBManagerTest : public ::testing::Test {
protected:
    void SetUp() override {
        // Clear users table before each test to ensure isolation
        pqxx::work W(*DBManager::getInstance().conn);
        W.exec("DELETE FROM users;");
        W.exec("ALTER SEQUENCE users_id_seq RESTART WITH 1;"); // Reset ID sequence
        W.commit();
    }
};

TEST_F(DBManagerTest, ConnectionStatus) {
    ASSERT_TRUE(DBManager::getInstance().isConnected());
}

TEST_F(DBManagerTest, CreateUserSuccessfully) {
    std::string username = "testuser";
    std::string passwordHash = PasswordHasher::hashPassword("password123");
    std::optional<User> user = DBManager::getInstance().createUser(username, passwordHash, UserRole::USER);

    ASSERT_TRUE(user.has_value());
    ASSERT_EQ(user->getUsername(), username);
    ASSERT_EQ(user->getPasswordHash(), passwordHash);
    ASSERT_EQ(user->getRole(), UserRole::USER);
    ASSERT_TRUE(user->getId().has_value());
    ASSERT_EQ(user->getId().value(), 1);
}

TEST_F(DBManagerTest, CreateDuplicateUserFails) {
    std::string username = "duplicateuser";
    std::string passwordHash = PasswordHasher::hashPassword("password123");
    DBManager::getInstance().createUser(username, passwordHash, UserRole::USER); // First creation

    std::optional<User> user2 = DBManager::getInstance().createUser(username, passwordHash, UserRole::USER); // Second creation
    ASSERT_FALSE(user2.has_value()); // Should return nullopt due to unique constraint
}

TEST_F(DBManagerTest, FindUserByIdSuccessfully) {
    std::string username = "findbyid";
    std::string passwordHash = PasswordHasher::hashPassword("password123");
    std::optional<User> createdUser = DBManager::getInstance().createUser(username, passwordHash, UserRole::USER);
    ASSERT_TRUE(createdUser.has_value());

    std::optional<User> foundUser = DBManager::getInstance().findUserById(createdUser->getId().value());
    ASSERT_TRUE(foundUser.has_value());
    ASSERT_EQ(foundUser->getUsername(), username);
    ASSERT_EQ(foundUser->getId().value(), createdUser->getId().value());
}

TEST_F(DBManagerTest, FindUserByIdNotFound) {
    std::optional<User> foundUser = DBManager::getInstance().findUserById(999); // Non-existent ID
    ASSERT_FALSE(foundUser.has_value());
}

TEST_F(DBManagerTest, FindUserByUsernameSuccessfully) {
    std::string username = "findbyname";
    std::string passwordHash = PasswordHasher::hashPassword("password123");
    DBManager::getInstance().createUser(username, passwordHash, UserRole::ADMIN);

    std::optional<User> foundUser = DBManager::getInstance().findUserByUsername(username);
    ASSERT_TRUE(foundUser.has_value());
    ASSERT_EQ(foundUser->getUsername(), username);
    ASSERT_EQ(foundUser->getRole(), UserRole::ADMIN);
}

TEST_F(DBManagerTest, FindUserByUsernameNotFound) {
    std::optional<User> foundUser = DBManager::getInstance().findUserByUsername("nonexistent");
    ASSERT_FALSE(foundUser.has_value());
}

TEST_F(DBManagerTest, UpdateUserSuccessfully) {
    std::string username = "user_to_update";
    std::string passwordHash = PasswordHasher::hashPassword("oldpass");
    std::optional<User> createdUser = DBManager::getInstance().createUser(username, passwordHash, UserRole::USER);
    ASSERT_TRUE(createdUser.has_value());

    User updatedUser = createdUser.value();
    updatedUser.setUsername("new_username");
    updatedUser.setPasswordHash(PasswordHasher::hashPassword("newpass"));
    updatedUser.setRole(UserRole::ADMIN);

    bool success = DBManager::getInstance().updateUser(updatedUser);
    ASSERT_TRUE(success);

    std::optional<User> fetchedUser = DBManager::getInstance().findUserById(updatedUser.getId().value());
    ASSERT_TRUE(fetchedUser.has_value());
    ASSERT_EQ(fetchedUser->getUsername(), "new_username");
    ASSERT_TRUE(PasswordHasher::verifyPassword("newpass", fetchedUser->getPasswordHash()));
    ASSERT_EQ(fetchedUser->getRole(), UserRole::ADMIN);
}

TEST_F(DBManagerTest, UpdateUserWithNonExistentIdFails) {
    User nonExistentUser(999, "nonexistent", "hash", UserRole::USER);
    bool success = DBManager::getInstance().updateUser(nonExistentUser);
    ASSERT_FALSE(success);
}

TEST_F(DBManagerTest, UpdateUserToDuplicateUsernameFails) {
    std::string username1 = "user1";
    std::string username2 = "user2";
    std::string passwordHash = PasswordHasher::hashPassword("pass");

    std::optional<User> user1 = DBManager::getInstance().createUser(username1, passwordHash, UserRole::USER);
    std::optional<User> user2 = DBManager::getInstance().createUser(username2, passwordHash, UserRole::USER);
    ASSERT_TRUE(user1.has_value());
    ASSERT_TRUE(user2.has_value());

    User user2_update = user2.value();
    user2_update.setUsername(username1); // Try to change user2's username to user1's
    bool success = DBManager::getInstance().updateUser(user2_update);
    ASSERT_FALSE(success); // Should fail due to unique constraint
}


TEST_F(DBManagerTest, DeleteUserSuccessfully) {
    std::string username = "user_to_delete";
    std::string passwordHash = PasswordHasher::hashPassword("password123");
    std::optional<User> createdUser = DBManager::getInstance().createUser(username, passwordHash, UserRole::USER);
    ASSERT_TRUE(createdUser.has_value());

    bool success = DBManager::getInstance().deleteUser(createdUser->getId().value());
    ASSERT_TRUE(success);

    std::optional<User> foundUser = DBManager::getInstance().findUserById(createdUser->getId().value());
    ASSERT_FALSE(foundUser.has_value()); // User should no longer exist
}

TEST_F(DBManagerTest, DeleteNonExistentUserFails) {
    bool success = DBManager::getInstance().deleteUser(999); // Non-existent ID
    ASSERT_FALSE(success);
}

TEST_F(DBManagerTest, GetAllUsersSuccessfully) {
    DBManager::getInstance().createUser("userA", PasswordHasher::hashPassword("passA"), UserRole::USER);
    DBManager::getInstance().createUser("userB", PasswordHasher::hashPassword("passB"), UserRole::ADMIN);
    DBManager::getInstance().createUser("userC", PasswordHasher::hashPassword("passC"), UserRole::USER);

    std::vector<User> users = DBManager::getInstance().getAllUsers();
    ASSERT_EQ(users.size(), 3);
    
    // Check if expected users are present
    bool foundA = false, foundB = false, foundC = false;
    for (const auto& user : users) {
        if (user.getUsername() == "userA") foundA = true;
        if (user.getUsername() == "userB") foundB = true;
        if (user.getUsername() == "userC") foundC = true;
    }
    ASSERT_TRUE(foundA);
    ASSERT_TRUE(foundB);
    ASSERT_TRUE(foundC);
}

TEST_F(DBManagerTest, GetAllUsersEmpty) {
    std::vector<User> users = DBManager::getInstance().getAllUsers();
    ASSERT_TRUE(users.empty());
}
```

### `backend/tests/integration/APITests.cpp`
```cpp