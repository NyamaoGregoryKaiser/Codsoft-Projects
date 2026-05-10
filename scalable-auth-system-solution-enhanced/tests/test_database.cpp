```cpp
#include <gtest/gtest.h>
#include "../database/Database.h"
#include "../utils/Logger.h"

class DatabaseTest : public ::testing::Test {
protected:
    std::unique_ptr<Database> db;
    std::string test_db_path = ":memory:"; // Use in-memory database for faster tests

    void SetUp() override {
        db = std::make_unique<Database>(test_db_path);
        db->open();
        // Create a simple table for testing
        db->execute("CREATE TABLE IF NOT EXISTS test_users (id INTEGER PRIMARY KEY, name TEXT, email TEXT UNIQUE);");
    }

    void TearDown() override {
        db->close();
    }
};

TEST_F(DatabaseTest, OpenAndCloseDatabase) {
    // Database is opened and closed in SetUp/TearDown, just ensure no exceptions
    ASSERT_NO_THROW(db->execute("SELECT 1;"));
}

TEST_F(DatabaseTest, ExecuteInsert) {
    ASSERT_NO_THROW(db->execute("INSERT INTO test_users (name, email) VALUES ('John Doe', 'john@example.com');"));
    std::vector<std::map<std::string, std::string>> results = db->query("SELECT name, email FROM test_users;");
    ASSERT_EQ(results.size(), 1);
    ASSERT_EQ(results[0]["name"], "John Doe");
    ASSERT_EQ(results[0]["email"], "john@example.com");
}

TEST_F(DatabaseTest, ExecuteInsertDuplicateUniqueConstraint) {
    ASSERT_NO_THROW(db->execute("INSERT INTO test_users (name, email) VALUES ('John Doe', 'john@example.com');"));
    ASSERT_THROW(db->execute("INSERT INTO test_users (name, email) VALUES ('Jane Doe', 'john@example.com');"), DatabaseException);
}

TEST_F(DatabaseTest, QueryMultipleRows) {
    db->execute("INSERT INTO test_users (name, email) VALUES ('Alice', 'alice@example.com');");
    db->execute("INSERT INTO test_users (name, email) VALUES ('Bob', 'bob@example.com');");
    std::vector<std::map<std::string, std::string>> results = db->query("SELECT name, email FROM test_users ORDER BY name;");
    ASSERT_EQ(results.size(), 2);
    ASSERT_EQ(results[0]["name"], "Alice");
    ASSERT_EQ(results[1]["name"], "Bob");
}

TEST_F(DatabaseTest, QuerySingleRow) {
    db->execute("INSERT INTO test_users (name, email) VALUES ('Charlie', 'charlie@example.com');");
    std::map<std::string, std::string> result = db->querySingle("SELECT name FROM test_users WHERE email = ?;", {"charlie@example.com"});
    ASSERT_FALSE(result.empty());
    ASSERT_EQ(result["name"], "Charlie");

    std::map<std::string, std::string> no_result = db->querySingle("SELECT name FROM test_users WHERE email = ?;", {"nonexistent@example.com"});
    ASSERT_TRUE(no_result.empty());
}

TEST_F(DatabaseTest, QueryWithParameters) {
    db->execute("INSERT INTO test_users (name, email) VALUES ('David', 'david@example.com');");
    db->execute("INSERT INTO test_users (name, email) VALUES ('Eve', 'eve@example.com');");

    std::vector<std::map<std::string, std::string>> results = db->query("SELECT name FROM test_users WHERE name = ?;", {"David"});
    ASSERT_EQ(results.size(), 1);
    ASSERT_EQ(results[0]["name"], "David");

    results = db->query("SELECT name FROM test_users WHERE name = ?;", {"Frank"});
    ASSERT_TRUE(results.empty());
}

TEST_F(DatabaseTest, GetLastInsertRowId) {
    db->execute("INSERT INTO test_users (name, email) VALUES ('Grace', 'grace@example.com');");
    long long first_id = db->getLastInsertRowId();
    ASSERT_GT(first_id, 0);

    db->execute("INSERT INTO test_users (name, email) VALUES ('Heidi', 'heidi@example.com');");
    long long second_id = db->getLastInsertRowId();
    ASSERT_GT(second_id, first_id);
}

TEST_F(DatabaseTest, DatabaseNotOpenThrows) {
    db->close();
    ASSERT_THROW(db->execute("SELECT 1;"), DatabaseException);
    ASSERT_THROW(db->query("SELECT 1;"), DatabaseException);
}
```