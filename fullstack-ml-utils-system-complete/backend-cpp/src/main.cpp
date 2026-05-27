#include "crow.h"
#include "config/config.hpp"
#include "utils/logger.hpp"
#include "utils/jwt_manager.hpp"
#include "repositories/db_connection.hpp"
#include "services/user_service.hpp"
#include "services/auth_service.hpp"
#include "services/ml_service.hpp"
#include "controllers/auth_controller.hpp"
#include "controllers/user_controller.hpp"
#include "controllers/model_controller.hpp"
#include "controllers/data_controller.hpp"
#include "middleware/logging_middleware.hpp"
#include "middleware/error_middleware.hpp"
#include "middleware/auth_middleware.hpp"
#include "middleware/ratelimit_middleware.hpp"
#include "utils/cache_manager.hpp" // For Caching

#include <iostream>
#include <memory>
#include <string>

/**
 * @brief Main entry point for the ML Utilities System Backend application.
 *
 * This file initializes the Crow web server, sets up dependencies,
 * registers middleware, and defines API endpoints.
 */
int main() {
    // 1. Initialize Logger
    Logger::init();
    LOG_INFO("ML Utilities System Backend Starting...");

    // 2. Load Configuration
    if (!Config::loadFromEnv()) {
        LOG_CRITICAL("Failed to load configuration from environment variables. Exiting.");
        return 1;
    }
    LOG_INFO("Configuration loaded successfully.");

    // 3. Initialize Database Connection Pool
    std::shared_ptr<DBConnectionPool> db_pool = nullptr;
    try {
        db_pool = std::make_shared<DBConnectionPool>(
            Config::get("DB_HOST"),
            Config::get("DB_PORT"),
            Config::get("DB_NAME"),
            Config::get("DB_USER"),
            Config::get("DB_PASSWORD"),
            std::stoi(Config::get("DB_POOL_SIZE", "5"))
        );
        LOG_INFO("Database connection pool initialized.");
    } catch (const std::exception& e) {
        LOG_CRITICAL("Failed to initialize database pool: {}", e.what());
        return 1;
    }

    // 4. Initialize JWT Manager
    JWTManager::init(Config::get("JWT_SECRET"), std::stoi(Config::get("JWT_EXPIRATION_HOURS", "24")));
    LOG_INFO("JWT Manager initialized.");

    // 5. Initialize Cache Manager
    CacheManager::init(std::stoi(Config::get("CACHE_TTL_SECONDS", "300"))); // 5 minutes TTL
    LOG_INFO("Cache Manager initialized.");

    // 6. Initialize Services
    auto user_repo = std::make_shared<UserRepository>(db_pool);
    auto ml_repo = std::make_shared<ModelRepository>(db_pool);

    auto user_service = std::make_shared<UserService>(user_repo);
    auto auth_service = std::make_shared<AuthService>(user_repo);
    auto ml_service = std::make_shared<MLService>(ml_repo);

    // 7. Initialize Crow Application
    crow::App<
        LoggingMiddleware,
        ErrorMiddleware,
        AuthMiddleware,
        RateLimitMiddleware
    > app;

    // Set custom error handler to return JSON
    app.set_error_handler([](crow::response& res) {
        res.set_header("Content-Type", "application/json");
        res.body = nlohmann::json({
            {"statusCode", res.code},
            {"message", crow::get_http_status_code_string(res.code)}
        }).dump();
    });

    // 8. Register Controllers
    AuthController auth_controller(app, auth_service);
    UserController user_controller(app, user_service);
    ModelController model_controller(app, ml_service);
    DataController data_controller(app, ml_service);

    // 9. Start Server
    int port = std::stoi(Config::get("APP_PORT", "8080"));
    std::string host = Config::get("APP_HOST", "0.0.0.0");
    int workers = std::stoi(Config::get("APP_WORKERS", "4"));

    LOG_INFO("Server listening on {}:{} with {} workers.", host, port, workers);
    app.port(port).address(host).multithreaded().run();

    LOG_INFO("ML Utilities System Backend Shutting Down.");

    return 0;
}