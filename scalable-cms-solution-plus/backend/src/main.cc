#include <drogon/drogon.h>
#include "config/AppConfig.h"
#include "utils/Logger.h"
#include "services/CacheService.h"
#include "database/DbClientManager.h"
#include "middleware/AuthMiddleware.h" // Include for registration

// Declare controllers (drogon will discover them, but good practice to include)
#include "controllers/AuthController.h"
#include "controllers/UserController.h"
#include "controllers/CategoryController.h"
#include "controllers/PostController.h"

int main()
{
    // Load application configuration
    AppConfig::loadConfig("config/default.json"); // Default config
    // Override with environment-specific config if needed (e.g., development.json)
    // AppConfig::loadConfig("config/development.json", true);

    // Initialize logger
    Logger::initialize(
        AppConfig::getString("log_path", "logs/cms_backend.log"),
        static_cast<spdlog::level::level_enum>(AppConfig::getInt("log_level", spdlog::level::info))
    );
    LOG_INFO("Logger initialized. Application starting...");

    // Initialize CacheService (Redis)
    CacheService::instance().init(
        AppConfig::getString("redis_host", "127.0.0.1"),
        AppConfig::getInt("redis_port", 6379),
        AppConfig::getInt("redis_db", 0)
    );
    LOG_INFO("CacheService (Redis) initialized.");

    // Initialize Drogon's database clients using the configuration
    drogon::app().loadConfig("config/default.json");

    // Get database client manager instance
    DbClientManager::instance().init();
    LOG_INFO("Database client manager initialized.");

    // Register global middleware (filters in Drogon terminology)
    // Drogon filters are automatically registered if defined as such, but we
    // might have custom global error handlers or logging.
    // For JWT authentication, we'll apply it per route or group.

    // Set HTTP listening port and IP
    drogon::app().setHttpPort(AppConfig::getInt("http_port", 8080));
    drogon::app().addListener(AppConfig::getString("http_host", "0.0.0.0"),
                              AppConfig::getInt("http_port", 8080));

    // Enable CORS for frontend development
    drogon::app().enableCORS(true, {AppConfig::getString("frontend_origin", "http://localhost:3000")})
                  .set  CORSMethods({drogon::HttpMethod::Get,
                                     drogon::HttpMethod::Post,
                                     drogon::HttpMethod::Put,
                                     drogon::HttpMethod::Delete,
                                     drogon::HttpMethod::Options})
                  .set  CORSHeaders({"Content-Type", "Authorization", "X-Requested-With"});

    // Set number of threads for the IO loop
    drogon::app().setThreadNum(AppConfig::getInt("thread_num", 4));

    // Start the application
    LOG_INFO("Application starting on {}:{} with {} threads...",
             AppConfig::getString("http_host"), AppConfig::getInt("http_port"),
             AppConfig::getInt("thread_num"));
    drogon::app().run();

    LOG_INFO("Application stopped.");
    return 0;
}
```