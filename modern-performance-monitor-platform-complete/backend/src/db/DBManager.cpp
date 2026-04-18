```cpp
#include "DBManager.h"
#include "../utils/Config.h"
#include "../exceptions/AppException.h"
#include <mutex> // Required for std::once_flag

std::unique_ptr<DBManager> DBManager::instance = nullptr;
std::once_flag DBManager::init_flag;

DBManager::DBManager() {
    Logger::get_logger()->info("Initializing DBManager...");
    try {
        Config::load(); // Ensure config is loaded
        connection_string = "dbname=" + Config::get("DB_NAME") +
                            " user=" + Config::get("DB_USER") +
                            " password=" + Config::get("DB_PASSWORD") +
                            " host=" + Config::get("DB_HOST") +
                            " port=" + Config::get("DB_PORT");
        Logger::get_logger()->info("Database connection string configured for: {}:{}/{}",
                                   Config::get("DB_HOST"), Config::get("DB_PORT"), Config::get("DB_NAME"));
    } catch (const std::exception& e) {
        Logger::get_logger()->critical("Failed to load DB config: {}", e.what());
        throw AppException(AppException::DATABASE_ERROR, "Failed to load database configuration.");
    }
}

DBManager& DBManager::get_instance() {
    std::call_once(init_flag, []() {
        instance.reset(new DBManager());
    });
    return *instance;
}

std::unique_ptr<pqxx::connection> DBManager::get_connection() {
    try {
        // libpqxx connections are not thread-safe and should be created per-request/per-thread
        return std::make_unique<pqxx::connection>(connection_string);
    } catch (const pqxx::broken_connection& e) {
        Logger::get_logger()->error("Database connection broken: {}", e.what());
        throw AppException(AppException::DATABASE_ERROR, "Database connection broken.");
    } catch (const pqxx::sql_error& e) {
        Logger::get_logger()->error("SQL error: {}", e.what());
        throw AppException(AppException::DATABASE_ERROR, "Database SQL error: " + std::string(e.what()));
    } catch (const std::exception& e) {
        Logger::get_logger()->error("Failed to connect to database: {}", e.what());
        throw AppException(AppException::DATABASE_ERROR, "Failed to connect to database.");
    }
}
```