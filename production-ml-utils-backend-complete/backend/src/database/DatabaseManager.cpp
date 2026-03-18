#include "DatabaseManager.h"
#include "spdlog/spdlog.h"
#include <fstream>
#include <sstream>
#include <filesystem> // C++17 for directory creation

namespace fs = std::filesystem;

DatabaseManager& DatabaseManager::getInstance() {
    static DatabaseManager instance;
    return instance;
}

void DatabaseManager::init(const std::string& db_file_path) {
    this->db_path = db_file_path;

    // Create data directory if it doesn't exist
    fs::path path(db_file_path);
    if (path.has_parent_path()) {
        fs::create_directories(path.parent_path());
    }

    try {
        db = sqlite::database(db_file_path);
        spdlog::info("Successfully connected to database: {}", db_file_path);

        // Enable WAL mode for better concurrency (optional, but good for web apps)
        execute("PRAGMA journal_mode = WAL;");
        // Enable foreign key constraints
        execute("PRAGMA foreign_keys = ON;");

    } catch (const sqlite::sqlite_exception& e) {
        spdlog::critical("SQLite error during init: {}. Code: {}", e.what(), e.get_sqlite_code());
        throw std::runtime_error("Failed to initialize database: " + std::string(e.what()));
    }
}

void DatabaseManager::runMigrations() {
    execute("CREATE TABLE IF NOT EXISTS migrations (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);");

    fs::path migrations_dir = fs::path(db_path).parent_path() / "migrations";
    if (!fs::exists(migrations_dir)) {
        spdlog::warn("Migrations directory not found: {}", migrations_dir.string());
        return;
    }

    for (const auto& entry : fs::directory_iterator(migrations_dir)) {
        if (entry.is_regular_file() && entry.path().extension() == ".sql") {
            std::string migration_name = entry.path().stem().string(); // Get filename without extension

            // Check if migration has already run
            bool migration_exists = false;
            db << "SELECT COUNT(*) FROM migrations WHERE name = ?" << migration_name >> [&](int count) {
                migration_exists = (count > 0);
            };

            if (!migration_exists) {
                spdlog::info("Running migration: {}", migration_name);
                std::ifstream migration_file(entry.path().string());
                std::stringstream buffer;
                buffer << migration_file.rdbuf();
                std::string sql_content = buffer.str();

                try {
                    db << sql_content; // Execute migration SQL
                    db << "INSERT INTO migrations (name) VALUES (?)" << migration_name; // Record migration
                    spdlog::info("Migration '{}' applied successfully.", migration_name);
                } catch (const sqlite::sqlite_exception& e) {
                    spdlog::error("Error applying migration '{}': {}. SQL: {}", migration_name, e.what(), sql_content);
                    throw std::runtime_error("Failed to apply migration " + migration_name + ": " + e.what());
                }
            } else {
                spdlog::debug("Migration '{}' already applied, skipping.", migration_name);
            }
        }
    }
}

void DatabaseManager::execute(const std::string& sql, std::function<void(sqlite::database_binder&)> bind_params) {
    try {
        if (bind_params) {
            db << sql << bind_params;
        } else {
            db << sql;
        }
    } catch (const sqlite::sqlite_exception& e) {
        spdlog::error("SQLite error during execute: {}. SQL: {}", e.what(), sql);
        throw std::runtime_error("Database execute failed: " + std::string(e.what()));
    }
}
```