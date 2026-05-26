#include "DBManager.h"
#include "SQLQueries.h"
#include <iostream>

namespace DataVizPro {

DBManager& DBManager::getInstance() {
    static DBManager instance;
    return instance;
}

void DBManager::initialize(const std::string& conn_str) {
    if (initialized) {
        LOG_INFO("DBManager already initialized.");
        return;
    }
    connection_string = conn_str;
    try {
        // Test connection
        pqxx::connection conn(connection_string);
        conn.activate();
        LOG_INFO("Successfully connected to database: {}", conn.dbname());
        initialized = true;
    } catch (const pqxx::sql_error& e) {
        LOG_CRITICAL("Database SQL error during initialization: {}", e.what());
        throw DataVizError(ErrorCode::DB_ERROR, "Database initialization failed (SQL error)", e.what(), 503);
    } catch (const std::exception& e) {
        LOG_CRITICAL("Database connection failed during initialization: {}", e.what());
        throw DataVizError(ErrorCode::DB_ERROR, "Database initialization failed (connection error)", e.what(), 503);
    }
}

std::unique_ptr<pqxx::connection> DBManager::getConnection() {
    if (!initialized) {
        throw DataVizError(ErrorCode::SERVICE_UNAVAILABLE, "Database not initialized", "Call DBManager::initialize() first", 503);
    }
    try {
        return std::make_unique<pqxx::connection>(connection_string);
    } catch (const pqxx::sql_error& e) {
        LOG_ERROR("SQL error getting DB connection: {}", e.what());
        throw DataVizError(ErrorCode::DB_ERROR, "Failed to get database connection (SQL error)", e.what(), 500);
    } catch (const std::exception& e) {
        LOG_ERROR("Error getting DB connection: {}", e.what());
        throw DataVizError(ErrorCode::DB_ERROR, "Failed to get database connection", e.what(), 500);
    }
}

void DBManager::executeMigration(pqxx::transaction_base& txn, const std::string& query, const std::string& migration_name) {
    try {
        txn.exec(query);
        LOG_INFO("Migration '{}' executed successfully.", migration_name);
    } catch (const pqxx::sql_error& e) {
        LOG_CRITICAL("Failed to execute migration '{}': {}", migration_name, e.what());
        throw; // Re-throw to be caught by runMigrations for rollback
    }
}

void DBManager::runMigrations() {
    if (!initialized) {
        throw DataVizError(ErrorCode::SERVICE_UNAVAILABLE, "Database not initialized for migrations", "Call DBManager::initialize() first", 503);
    }

    LOG_INFO("Running database migrations...");
    try {
        auto conn = getConnection();
        pqxx::work txn(*conn); // Use 'work' for transactions that commit
        
        // Create migrations table if it doesn't exist
        txn.exec(R"(
            CREATE TABLE IF NOT EXISTS _migrations (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) UNIQUE NOT NULL,
                applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        )");
        txn.commit(); // Commit the migration table creation

        // Re-open work for actual migrations
        pqxx::work migrations_txn(*conn);

        // Check and apply migrations
        if (migrations_txn.exec1("SELECT COUNT(*) FROM _migrations WHERE name = 'create_users_table'").at(0).as<long>() == 0) {
            executeMigration(migrations_txn, SQLQueries::CREATE_USER_TABLE, "create_users_table");
            migrations_txn.exec("INSERT INTO _migrations (name) VALUES ('create_users_table')");
        }
        if (migrations_txn.exec1("SELECT COUNT(*) FROM _migrations WHERE name = 'create_datasets_table'").at(0).as<long>() == 0) {
            executeMigration(migrations_txn, SQLQueries::CREATE_DATASET_TABLE, "create_datasets_table");
            migrations_txn.exec("INSERT INTO _migrations (name) VALUES ('create_datasets_table')");
        }
        if (migrations_txn.exec1("SELECT COUNT(*) FROM _migrations WHERE name = 'create_dashboards_table'").at(0).as<long>() == 0) {
            executeMigration(migrations_txn, SQLQueries::CREATE_DASHBOARD_TABLE, "create_dashboards_table");
            migrations_txn.exec("INSERT INTO _migrations (name) VALUES ('create_dashboards_table')");
        }
        
        // Add more migrations here as the schema evolves

        migrations_txn.commit();
        LOG_INFO("Database migrations completed successfully.");
    } catch (const pqxx::sql_error& e) {
        LOG_CRITICAL("Database migration failed: {}", e.what());
        throw DataVizError(ErrorCode::DB_ERROR, "Database migration failed", e.what(), 500);
    } catch (const std::exception& e) {
        LOG_CRITICAL("Error during database migration: {}", e.what());
        throw DataVizError(ErrorCode::DB_ERROR, "Database migration failed (general error)", e.what(), 500);
    }
}

} // namespace DataVizPro
```