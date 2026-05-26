#include "gtest/gtest.h"
#include "db/DBManager.h"
#include "db/SQLQueries.h"
#include "common/Error.h"
#include "utils/Logger.h"
#include <pqxx/pqxx>
#include <string>

using namespace DataVizPro;

// Define a test-specific connection string
const std::string TEST_DB_CONN_STR = "postgresql://user:password@localhost:5432/datavizpro_test";

class DBManagerTest : public ::testing::Test {
protected:
    void SetUp() override {
        // Initialize DBManager with test DB
        try {
            DBManager::getInstance().initialize(TEST_DB_CONN_STR);
            // Ensure a clean state for each test by dropping and recreating tables
            auto conn = DBManager::getInstance().getConnection();
            pqxx::work txn(*conn);
            txn.exec("DROP TABLE IF EXISTS dashboards CASCADE;");
            txn.exec("DROP TABLE IF EXISTS datasets CASCADE;");
            txn.exec("DROP TABLE IF EXISTS users CASCADE;");
            txn.exec("DROP TABLE IF EXISTS _migrations CASCADE;");
            txn.exec("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";");
            txn.commit();

            // Rerun migrations to setup tables
            DBManager::getInstance().runMigrations();
            LOG_INFO("Test DB setup complete.");
        } catch (const std::exception& e) {
            LOG_CRITICAL("Failed to setup test database: {}", e.what());
            // Fail the test if DB setup fails
            FAIL() << "Failed to set up test database: " << e.what();
        }
    }

    void TearDown() override {
        // Optional: Clean up test data after each test
        // DBManager::getInstance().cleanup();
    }
};

TEST_F(DBManagerTest, InitializationSuccessful) {
    // Already tested in SetUp, but a direct check for good measure
    ASSERT_NO_THROW({
        pqxx::connection conn(TEST_DB_CONN_STR);
        ASSERT_TRUE(conn.is_open());
    });
}

TEST_F(DBManagerTest, RunMigrationsCreatesTables) {
    auto conn = DBManager::getInstance().getConnection();
    pqxx::nontransaction N(*conn);

    // Check if users table exists
    pqxx::result users_table_check = N.exec("SELECT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users');");
    ASSERT_TRUE(users_table_check[0][0].as<bool>()) << "Users table should exist.";

    // Check if datasets table exists
    pqxx::result datasets_table_check = N.exec("SELECT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'datasets');");
    ASSERT_TRUE(datasets_table_check[0][0].as<bool>()) << "Datasets table should exist.";

    // Check if dashboards table exists
    pqxx::result dashboards_table_check = N.exec("SELECT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'dashboards');");
    ASSERT_TRUE(dashboards_table_check[0][0].as<bool>()) << "Dashboards table should exist.";

    // Check if _migrations table exists
    pqxx::result migrations_table_check = N.exec("SELECT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = '_migrations');");
    ASSERT_TRUE(migrations_table_check[0][0].as<bool>()) << "_migrations table should exist.";
}

TEST_F(DBManagerTest, InsertAndSelectUser) {
    auto conn = DBManager::getInstance().getConnection();
    pqxx::work txn(*conn);

    std::string username = "testuser";
    std::string email = "test@example.com";
    std::string password_hash = "hashed_password"; // Simplified for test

    pqxx::result r = txn.exec_params(SQLQueries::INSERT_USER, username, email, password_hash);
    txn.commit();

    ASSERT_FALSE(r.empty());
    std::string user_id = r[0][0].as<std::string>();

    pqxx::nontransaction N(*conn);
    pqxx::result select_r = N.exec_params(SQLQueries::SELECT_USER_BY_ID, pqxx::uuid_string(user_id));

    ASSERT_FALSE(select_r.empty());
    ASSERT_EQ(select_r[0]["username"].as<std::string>(), username);
    ASSERT_EQ(select_r[0]["email"].as<std::string>(), email);
    // password_hash is not selected in SELECT_USER_BY_ID for security
}

TEST_F(DBManagerTest, DuplicateUsernameFails) {
    auto conn = DBManager::getInstance().getConnection();
    pqxx::work txn1(*conn);
    txn1.exec_params(SQLQueries::INSERT_USER, "duplicate_user", "dup1@example.com", "hash1");
    txn1.commit();

    pqxx::work txn2(*conn);
    ASSERT_THROW(
        txn2.exec_params(SQLQueries::INSERT_USER, "duplicate_user", "dup2@example.com", "hash2"),
        pqxx::unique_violation
    );
    txn2.abort(); // Rollback the failed transaction
}
```