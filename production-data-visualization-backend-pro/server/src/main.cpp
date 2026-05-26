#include <crow.h>
#include "utils/Logger.h"
#include "db/DBManager.h"
#include "middleware/AuthMiddleware.h"
#include "middleware/ErrorMiddleware.h"
#include "handlers/UserHandler.h"
#include "handlers/DatasetHandler.h"
#include "handlers/DashboardHandler.h"
#include "config/AppConfig.h"
#include <iostream>
#include <cstdlib> // For std::exit

int main() {
    using namespace DataVizPro;

    Logger::get_logger()->set_level(spdlog::level::debug);
    LOG_INFO("DataViz Pro Server Starting...");

    // 1. Load Configuration
    AppConfig config = AppConfig::load();
    LOG_INFO("Server Port: {}", config.server_port);
    LOG_INFO("DB Connection String (sanitized): {}", config.db_connection_string.substr(0, config.db_connection_string.find("password") + 8) + "..."); // Basic sanitization

    // 2. Initialize Database Manager and run migrations
    try {
        DBManager::getInstance().initialize(config.db_connection_string);
        DBManager::getInstance().runMigrations();
    } catch (const DataVizError& e) {
        LOG_CRITICAL("Server failed to initialize database: {}", e.what());
        std::exit(EXIT_FAILURE);
    } catch (const std::exception& e) {
        LOG_CRITICAL("An unexpected error occurred during database initialization: {}", e.what());
        std::exit(EXIT_FAILURE);
    }

    // 3. Setup Crow App with Middlewares
    crow::App<AuthMiddleware, ErrorMiddleware> app;

    // Global Rate Limiter (example: 100 requests per minute per IP)
    RateLimiter global_rate_limiter(100, std::chrono::minutes(1));
    app.middleware_by_value<crow::CookieParser>(); // For session management, if needed. Not used in JWT example.

    // Health Check Endpoint (no auth required)
    CROW_ROUTE(app, "/health")([](){
        return crow::response(200, "{\"status\": \"UP\"}");
    });

    // 4. Register Handlers
    UserHandler user_handler;
    user_handler.registerRoutes(app);

    DatasetHandler dataset_handler;
    dataset_handler.registerRoutes(app);

    DashboardHandler dashboard_handler;
    dashboard_handler.registerRoutes(app);

    // 5. Run the server
    LOG_INFO("DataViz Pro Server ready on port {}", config.server_port);
    app.port(config.server_port).multithreaded().run();

    LOG_INFO("DataViz Pro Server Shutting down.");
    return 0;
}
```