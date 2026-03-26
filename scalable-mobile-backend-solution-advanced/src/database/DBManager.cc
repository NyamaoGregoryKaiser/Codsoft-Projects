```cpp
#include "DBManager.h"
#include "../utils/Logger.h"
#include <stdexcept>

// Static member definition
drogon::orm::DbClientPtr DBManager::s_dbClient = nullptr;

void DBManager::init(const std::string& host, int port,
                     const std::string& user, const std::string& password,
                     const std::string& dbname, size_t connNum) {
    if (s_dbClient) {
        LOG_WARN("DBManager already initialized. Skipping re-initialization.");
        return;
    }

    try {
        // Drogon's app() handles the lifecycle of clients.
        // If a client with the same connection info is already added via config, it reuses it.
        // Otherwise, it creates a new one.
        drogon::app().addDbClient(
            "postgresql",
            host,
            port,
            user,
            password,
            dbname,
            connNum, // Max connections in pool
            "default_db_client" // Client name
        );
        s_dbClient = drogon::app().getDbClient("default_db_client");

        if (!s_dbClient) {
            LOG_CRITICAL("Failed to get or create Drogon DB client after addDbClient call.");
            throw std::runtime_error("Failed to initialize Drogon DB client.");
        }

        LOG_INFO("Database client initialized for PostgreSQL: {}:{}/{} with {} connections.",
                 host, port, dbname, connNum);
    } catch (const std::exception& e) {
        LOG_CRITICAL("Error initializing database client: {}", e.what());
        throw; // Re-throw to indicate a critical setup failure
    }
}

drogon::orm::DbClientPtr DBManager::getClient() {
    if (!s_dbClient) {
        LOG_CRITICAL("DBManager not initialized. Call DBManager::init() before using getClient().");
        throw std::runtime_error("DBManager not initialized.");
    }
    return s_dbClient;
}
```