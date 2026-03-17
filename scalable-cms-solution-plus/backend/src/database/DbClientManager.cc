#include "DbClientManager.h"
#include "utils/Logger.h"
#include "config/AppConfig.h"

DbClientManager::DbClientManager() : initialized_(false) {}

DbClientManager& DbClientManager::instance() {
    static DbClientManager instance;
    return instance;
}

void DbClientManager::init() {
    std::lock_guard<std::mutex> lock(clientMutex_);
    if (initialized_) {
        LOG_WARN("DbClientManager already initialized.");
        return;
    }

    // Drogon's app().loadConfig() should have already initialized the clients.
    // We just need to get a handle to the default client.
    try {
        defaultClient_ = drogon::app().getDbClient(AppConfig::getString("database.client_name", "default"));
        if (!defaultClient_) {
            LOG_ERROR("Failed to get default database client. Check drogon configuration.");
            exit(EXIT_FAILURE); // Critical error
        }
        initialized_ = true;
        LOG_INFO("Default database client obtained successfully.");
    } catch (const std::exception& e) {
        LOG_CRITICAL("Exception while getting default database client: {}", e.what());
        exit(EXIT_FAILURE); // Critical error
    }
}

drogon::orm::DbClientPtr DbClientManager::getDbClient() {
    std::lock_guard<std::mutex> lock(clientMutex_);
    if (!initialized_ || !defaultClient_) {
        LOG_ERROR("Attempted to get database client before initialization or client is null. Re-initializing.");
        // Try to re-initialize if not initialized or client somehow became null
        init();
        if (!defaultClient_) {
             LOG_CRITICAL("Failed to re-initialize database client. Cannot proceed.");
             // In a real application, you might want to throw an exception or return a special error code
             // For now, let's return nullptr and let the caller handle it.
             return nullptr;
        }
    }
    return defaultClient_;
}
```