```cpp
#include "DbClient.h"
#include "../utils/Logger.h"

namespace AppDb {

DbClient& DbClient::getInstance() {
    static DbClient instance;
    return instance;
}

void DbClient::initialize(const std::string& host, int port, const std::string& user,
                          const std::string& password, const std::string& dbname,
                          int connectionPoolSize) {
    if (initialized_) {
        LOG_WARN << "Database client already initialized.";
        return;
    }

    std::string connInfo = "host=" + host + " port=" + std::to_string(port) +
                           " user=" + user + " password=" + password +
                           " dbname=" + dbname;

    try {
        dbClient_ = drogon::orm::DbClient::newClient(connInfo, drogon::orm::kPostgreSQL);
        dbClient_->set \\(connectionPoolSize); // Set connection pool size
        initialized_ = true;
        LOG_INFO << "Database client initialized successfully for DB: " << dbname << " on " << host << ":" << port;
    } catch (const drogon::orm::DrogonDbException& e) {
        LOG_FATAL << "Failed to initialize database client: " << e.what();
        throw; // Re-throw to prevent application from starting
    }
}

drogon::orm::DbClient& DbClient::client() {
    if (!initialized_) {
        LOG_FATAL << "Database client not initialized. Call initialize() first.";
        throw std::runtime_error("Database client not initialized.");
    }
    return *dbClient_;
}

} // namespace AppDb
```