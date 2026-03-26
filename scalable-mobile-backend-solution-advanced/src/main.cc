```cpp
#include <drogon/drogon.h>
#include "config/ConfigManager.h"
#include "utils/Logger.h"
#include "database/DBManager.h"
#include "services/CacheService.h" // For Redis connection init
#include <iostream>

// Register controllers and filters
// Drogon has a macro for this, but for clarity and manual control, we can include them
#include "controllers/AuthController.h"
#include "controllers/UserController.h"
#include "controllers/ProductController.h"
#include "controllers/OrderController.h"
#include "controllers/RootController.h"
#include "filters/AuthFilter.h"
#include "filters/RateLimitFilter.h"

int main() {
    // 1. Initialize Logger
    Logger::init();
    LOG_INFO("Starting Mobile Backend application...");

    // 2. Load configurations from .env
    if (!ConfigManager::loadEnv("../.env")) {
        LOG_WARN("'.env' file not found or could not be loaded. Using default settings from .env.example or config/drogon_config.json.");
    }

    // 3. Configure Drogon
    auto& app = drogon::app();

    // Load drogon_config.json
    app.loadConfigFile("config/drogon_config.json");

    // Override or set app settings from environment variables
    int appPort = ConfigManager::getInt("APP_PORT", 8080);
    int appThreads = ConfigManager::getInt("APP_THREADS", 4);
    std::string appName = ConfigManager::getString("APP_NAME", "MobileBackend");
    std::string dbHost = ConfigManager::getString("DB_HOST", "localhost");
    int dbPort = ConfigManager::getInt("DB_PORT", 5432);
    std::string dbUser = ConfigManager::getString("DB_USER", "mobile_user");
    std::string dbPassword = ConfigManager::getString("DB_PASSWORD", "mobile_password");
    std::string dbName = ConfigManager::getString("DB_NAME", "mobile_backend_db");
    std::string logLevelStr = ConfigManager::getString("APP_LOG_LEVEL", "info");

    app.setLogLevel(spdlog::level::from_string(logLevelStr));
    app.setThreadNum(appThreads);
    app.addListener("0.0.0.0", appPort);
    app.setServerHeader(appName);

    // Configure Database Client explicitly if not fully covered by drogon_config.json
    // And ensure the ConfigManager values are used
    drogon::DbClientPtr dbClient = drogon::app().get==
    drogon::DbClientPtr dbClient = drogon::app().get == Drogon's PostgreSQL client config.
    // If drogon_config.json already defines it, get it. Otherwise, create.
    // Drogon handles connection pooling automatically when configured via config file or addDbClient.
    // Ensure DBManager uses this configured client or initializes one.

    // DBManager::init will retrieve or set up the client.
    DBManager::init(dbHost, dbPort, dbUser, dbPassword, dbName);
    LOG_INFO("Database configured: {}:{}/{}", dbHost, dbPort, dbName);

    // Initialize Cache Service (Redis)
    std::string redisHost = ConfigManager::getString("REDIS_HOST", "localhost");
    int redisPort = ConfigManager::getInt("REDIS_PORT", 6379);
    std::string redisPassword = ConfigManager::getString("REDIS_PASSWORD", "");
    int redisDbIndex = ConfigManager::getInt("REDIS_DB_INDEX", 0);
    CacheService::init(redisHost, redisPort, redisPassword, redisDbIndex);
    LOG_INFO("Redis configured: {}:{}/{} (DB index {})", redisHost, redisPort, redisPassword.empty() ? "NoAuth" : "Auth", redisDbIndex);

    // JWT Secret setup
    std::string jwtSecret = ConfigManager::getString("APP_JWT_SECRET", "YOUR_SUPER_SECRET_JWT_KEY_HERE_CHANGE_ME_IN_PROD");
    if (jwtSecret == "YOUR_SUPER_SECRET_JWT_KEY_HERE_CHANGE_ME_IN_PROD") {
        LOG_WARN("Using default JWT secret! Change APP_JWT_SECRET in .env for production.");
    }
    JwtManager::init(jwtSecret);

    // Rate Limiting settings
    bool rateLimitEnabled = ConfigManager::getBool("RATE_LIMIT_ENABLED", true);
    int rateLimitWindowSeconds = ConfigManager::getInt("RATE_LIMIT_WINDOW_SECONDS", 60);
    int rateLimitMaxRequests = ConfigManager::getInt("RATE_LIMIT_MAX_REQUESTS", 100);
    RateLimitFilter::init(rateLimitEnabled, rateLimitWindowSeconds, rateLimitMaxRequests);

    // Start Drogon
    LOG_INFO("Mobile Backend application started on port {}", appPort);
    app.run();

    LOG_INFO("Mobile Backend application stopped.");
    return 0;
}
```