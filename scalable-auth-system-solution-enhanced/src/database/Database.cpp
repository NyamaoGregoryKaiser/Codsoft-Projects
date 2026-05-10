```cpp
#include "Database.h"
#include "../utils/Logger.h" // For logging database operations
#include <filesystem> // For std::filesystem::create_directories

namespace fs = std::filesystem;

Database::Database(const std::string& db_path) : db_path_(db_path), db_(nullptr) {
    // Ensure the directory for the database file exists
    fs::path path_obj(db_path_);
    fs::path dir = path_obj.parent_path();
    if (!dir.empty() && !fs::exists(dir)) {
        try {
            fs::create_directories(dir);
            LOG_INFO("Created database directory: %s", dir.c_str());
        } catch (const fs::filesystem_error& e) {
            LOG_ERROR("Failed to create database directory %s: %s", dir.c_str(), e.what());
            throw DatabaseException("Failed to create database directory: " + dir.string());
        }
    }
}

Database::~Database() {
    close();
}

void Database::open() {
    if (db_) {
        LOG_WARN("Database already open.");
        return;
    }

    int rc = sqlite3_open(db_path_.c_str(), &db_);
    if (rc) {
        LOG_ERROR("Can't open database: %s", sqlite3_errmsg(db_));
        throw DatabaseException("Can't open database: " + std::string(sqlite3_errmsg(db_)));
    } else {
        LOG_INFO("Opened database successfully: %s", db_path_.c_str());
        // Enable foreign key constraints
        execute("PRAGMA foreign_keys = ON;");
    }
}

void Database::close() {
    if (db_) {
        int rc = sqlite3_close(db_);
        if (rc != SQLITE_OK) {
            LOG_ERROR("Can't close database: %s", sqlite3_errmsg(db_));
            // Log, but don't throw, as destructor should not throw
        } else {
            LOG_INFO("Closed database successfully: %s", db_path_.c_str());
            db_ = nullptr;
        }
    }
}

void Database::check_rc(int rc, const std::string& message) const {
    if (rc != SQLITE_OK && rc != SQLITE_ROW && rc != SQLITE_DONE) {
        std::string error_msg = "Database error: ";
        if (!message.empty()) {
            error_msg += message + " - ";
        }
        if (db_) {
            error_msg += sqlite3_errmsg(db_);
        } else {
            error_msg += "No database connection.";
        }
        LOG_ERROR("%s", error_msg.c_str());
        throw DatabaseException(error_msg);
    }
}

void Database::execute(const std::string& sql) {
    if (!db_) {
        throw DatabaseException("Database not open for execution.");
    }
    char* err_msg = nullptr;
    int rc = sqlite3_exec(db_, sql.c_str(), nullptr, nullptr, &err_msg);
    if (rc != SQLITE_OK) {
        std::string error_str(err_msg);
        sqlite3_free(err_msg);
        LOG_ERROR("SQL error in execute '%s': %s", sql.substr(0, 100).c_str(), error_str.c_str());
        throw DatabaseException("SQL error: " + error_str);
    }
    LOG_DEBUG("SQL executed: %s", sql.substr(0, 100).c_str());
}

std::vector<std::map<std::string, std::string>> Database::query(const std::string& sql, 
                                                                 const std::vector<std::string>& params) {
    if (!db_) {
        throw DatabaseException("Database not open for query.");
    }

    sqlite3_stmt* stmt = nullptr;
    int rc = sqlite3_prepare_v2(db_, sql.c_str(), -1, &stmt, nullptr);
    check_rc(rc, "Failed to prepare SQL statement");

    // Bind parameters
    for (size_t i = 0; i < params.size(); ++i) {
        rc = sqlite3_bind_text(stmt, i + 1, params[i].c_str(), -1, SQLITE_TRANSIENT);
        check_rc(rc, "Failed to bind parameter " + std::to_string(i + 1));
    }

    std::vector<std::map<std::string, std::string>> results;
    while ((rc = sqlite3_step(stmt)) == SQLITE_ROW) {
        std::map<std::string, std::string> row;
        int num_cols = sqlite3_column_count(stmt);
        for (int i = 0; i < num_cols; ++i) {
            const char* col_name = sqlite3_column_name(stmt, i);
            const char* col_text = reinterpret_cast<const char*>(sqlite3_column_text(stmt, i));
            row[col_name] = col_text ? col_text : "";
        }
        results.push_back(row);
    }

    check_rc(rc, "Error during query execution"); // Will throw if rc is not SQLITE_DONE
    sqlite3_finalize(stmt);
    LOG_DEBUG("SQL query executed, %zu rows returned: %s", results.size(), sql.substr(0, 100).c_str());
    return results;
}

std::map<std::string, std::string> Database::querySingle(const std::string& sql,
                                                         const std::vector<std::string>& params) {
    std::vector<std::map<std::string, std::string>> results = query(sql, params);
    if (results.empty()) {
        return {};
    }
    return results[0];
}

long long Database::getLastInsertRowId() const {
    if (!db_) {
        throw DatabaseException("Database not open. Cannot get last insert row ID.");
    }
    return sqlite3_last_insert_rowid(db_);
}
```