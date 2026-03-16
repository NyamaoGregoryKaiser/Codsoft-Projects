```cpp
#include "DatabaseManager.h"
#include "core/utils/Logger.h"
#include <filesystem>
#include <fstream>
#include <chrono>
#include <iomanip> // For std::put_time

std::unique_ptr<soci::session> DatabaseManager::sql = nullptr;

void DatabaseManager::init(const std::string& connectionString) {
    if (!sql) {
        try {
            // Check if the database file exists if it's SQLite
            if (connectionString.rfind("sqlite3:", 0) == 0) { // Check prefix
                std::string db_file_path = connectionString.substr(connectionString.find(':') + 1);
                std::filesystem::path path(db_file_path);
                if (!std::filesystem::exists(path.parent_path())) {
                    std::filesystem::create_directories(path.parent_path());
                    Logger::info("Created database directory: {}", path.parent_path().string());
                }
            }
            
            sql = std::make_unique<soci::session>(soci::sqlite3, connectionString);
            Logger::info("Database connection established.");

            // Optional: Basic health check query
            int val;
            *sql << "SELECT 1", soci::into(val);
            if (val != 1) {
                throw DatabaseException("Database health check failed.");
            }
            Logger::info("Database health check passed.");

        } catch (const soci::soci_error& e) {
            Logger::error("SOCI error during database initialization: {}", e.what());
            throw DatabaseException("Failed to connect to database: " + std::string(e.what()));
        } catch (const std::exception& e) {
            Logger::error("Standard error during database initialization: {}", e.what());
            throw DatabaseException("Failed to initialize database: " + std::string(e.what()));
        }
    }
}

soci::session& DatabaseManager::getSession() {
    if (!sql) {
        throw DatabaseException("Database not initialized. Call init() first.");
    }
    return *sql;
}

void DatabaseManager::execute(const std::string& query) {
    try {
        soci::statement st = (getSession().prepare << query);
        st.execute(true); // Execute and fetch all rows (though we don't expect results here)
    } catch (const soci::soci_error& e) {
        Logger::error("SOCI error executing query '{}': {}", query, e.what());
        throw DatabaseException("Failed to execute database query: " + std::string(e.what()));
    }
}
```