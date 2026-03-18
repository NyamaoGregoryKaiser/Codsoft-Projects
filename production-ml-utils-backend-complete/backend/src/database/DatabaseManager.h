#pragma once

#include <string>
#include <sqlite_modern_cpp.h>
#include <vector>
#include <functional> // For std::function

class DatabaseManager {
private:
    sqlite::database db;
    std::string db_path;

    DatabaseManager() = default; // Private constructor for Singleton

public:
    static DatabaseManager& getInstance(); // Singleton accessor

    // Delete copy constructor and assignment operator
    DatabaseManager(const DatabaseManager&) = delete;
    DatabaseManager& operator=(const DatabaseManager&) = delete;

    void init(const std::string& db_file_path);
    void runMigrations();

    // Generic query method for SELECT (returns a vector of JSON objects)
    template<typename T>
    std::vector<T> query(const std::string& sql, std::function<T(sqlite::database_binder&)> row_parser) {
        std::vector<T> results;
        db << sql >> [&](sqlite::database_binder& binder) {
            results.push_back(row_parser(binder));
        };
        return results;
    }

    // Generic execute method for INSERT, UPDATE, DELETE, etc.
    void execute(const std::string& sql, std::function<void(sqlite::database_binder&)> bind_params = {});

    // Get a reference to the underlying database object for direct use if needed
    sqlite::database& getDb() { return db; }
};
```