```cpp
#include <drogon/drogon.h>
#include "config/AppConfig.h"
#include "database/DbClient.h"
#include "utils/Logger.h"
#include "utils/JwtManager.h"
#include "utils/Cache.h"

int main() {
    // 1. Initialize Logger
    AppConfig::ConfigManager::getInstance().loadConfig("config/app_config.json");
    const auto& serverConfig = AppConfig::ConfigManager::getInstance().getServerConfig();
    const auto& dbConfig = AppConfig::ConfigManager::getInstance().getDatabaseConfig();
    const auto& jwtConfig = AppConfig::ConfigManager::getInstance().getJwtConfig();
    const auto& cacheConfig = AppConfig::ConfigManager::getInstance().getCacheConfig();

    AppUtils::Logger::init(serverConfig.logLevel);

    LOG_INFO << "Starting Product Catalog Service...";

    // 2. Initialize Database Client
    try {
        AppDb::DbClient::getInstance().initialize(
            dbConfig.host, dbConfig.port, dbConfig.user, dbConfig.password, dbConfig.dbname, dbConfig.connectionPoolSize
        );
    } catch (const std::exception& e) {
        LOG_FATAL << "Failed to initialize database: " << e.what();
        return 1;
    }

    // 3. Initialize JWT Manager
    AppUtils::JwtManager::getInstance().initialize(jwtConfig.secret, jwtConfig.expiryMinutes);

    // 4. Initialize Cache
    AppUtils::Cache::getInstance().setMaxSize(cacheConfig.maxSize);


    // 5. Configure Drogon Server
    drogon::app().addListener("0.0.0.0", serverConfig.port);
    drogon::app().setThreadNum(serverConfig.threads);
    drogon::app().enableSession(60 * 24); // Enable sessions, 24-hour expiry
    drogon::app().enableHttps(true, "server.pem", "server.key"); // Enable HTTPS for production
    drogon::app().setLogPath("./log"); // Set log path for drogon's internal logging
    drogon::app().setLogLevel(static_cast<trantor::LogLevel>(
        trantor::Logger::LogLevel::fromString(serverConfig.logLevel)
    ));

    // Configure static file serving
    // Ensure the path is relative to the executable or an absolute path
    drogon::app().setDocumentRoot(serverConfig.staticFilesPath);
    LOG_INFO << "Serving static files from: " << serverConfig.staticFilesPath;

    // Load controllers and start the server
    LOG_INFO << "Drogon server starting on port " << serverConfig.port << " with " << serverConfig.threads << " threads.";
    drogon::app().run();

    LOG_INFO << "Product Catalog Service stopped.";
    return 0;
}
```