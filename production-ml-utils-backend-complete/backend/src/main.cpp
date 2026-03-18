#include <iostream>
#include <string>
#include <stdexcept>

#include "crow.h"
#include "spdlog/spdlog.h"
#include "spdlog/sinks/stdout_color_sinks.h"

#include "config/AppConfig.h"
#include "database/DatabaseManager.h"
#include "routes.h"
#include "common/ErrorHandling.h"
#include "middleware/LoggingMiddleware.h"

int main() {
    // 1. Initialize Logger
    auto console_sink = std::make_shared<spdlog::sinks::stdout_color_sink_mt>();
    console_sink->set_pattern("[%Y-%m-%d %H:%M:%S.%e] [%^%l%$] [thread %t] %v");
    spdlog::set_default_logger(std::make_shared<spdlog::logger>("ML_UTIL_LOG", console_sink));

    // 2. Load Configuration
    AppConfig& config = AppConfig::getInstance();
    try {
        config.loadFromEnv();
        spdlog::set_level(spdlog::level::from_string(config.getLogLevel()));
        spdlog::info("Application configuration loaded successfully.");
        spdlog::info("Running in {} environment on port {}", config.getAppEnv(), config.getPort());
    } catch (const std::exception& e) {
        spdlog::critical("Failed to load application configuration: {}", e.what());
        return 1;
    }

    // 3. Initialize Database
    DatabaseManager& db_manager = DatabaseManager::getInstance();
    try {
        db_manager.init(config.getDatabasePath());
        db_manager.runMigrations(); // Apply migrations on startup
        spdlog::info("Database initialized and migrations applied successfully.");
    } catch (const std::exception& e) {
        spdlog::critical("Failed to initialize database: {}", e.what());
        return 1;
    }

    // 4. Initialize Crow App
    crow::App<
        LoggingMiddleware,
        AuthMiddleware,
        CacheMiddleware,
        RateLimitMiddleware
    > app;

    // 5. Register Routes
    register_routes(app);

    // 6. Global Error Handling (Crow's built-in)
    // Crow catches exceptions from handlers. We can customize the response.
    app.set_error_handler([](crow::response& res) {
        // This is a generic handler for uncaught exceptions within Crow routes.
        // Our specific ErrorHandling.h functions should handle most expected errors.
        res.set_header("Content-Type", "application/json");
        switch (res.code) {
            case 400: res.write(R"({"status": "error", "message": "Bad request."})"); break;
            case 401: res.write(R"({"status": "error", "message": "Unauthorized."})"); break;
            case 403: res.write(R"({"status": "error", "message": "Forbidden."})"); break;
            case 404: res.write(R"({"status": "error", "message": "Not Found."})"); break;
            case 500: res.write(R"({"status": "error", "message": "Internal server error."})"); break;
            default: res.write(R"({"status": "error", "message": "An unexpected error occurred."})"); break;
        }
        res.end();
    });

    // 7. Start Server
    try {
        spdlog::info("Starting server on port {}", config.getPort());
        app.port(config.getPort()).multithreaded().run();
    } catch (const std::exception& e) {
        spdlog::critical("Server failed to start: {}", e.what());
        return 1;
    }

    spdlog::info("Server shutting down.");
    return 0;
}
```