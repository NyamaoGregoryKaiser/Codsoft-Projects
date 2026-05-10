```cpp
#include "crow.h"
#include "config/Config.h"
#include "database/Database.h"
#include "auth/AuthService.h"
#include "auth/AuthMiddleware.h"
#include "controllers/AuthController.h"
#include "controllers/UserController.h"
#include "middleware/ErrorHandlingMiddleware.h"
#include "middleware/RateLimitingMiddleware.h" // Conceptual
#include "middleware/CachingMiddleware.h"     // Conceptual
#include "utils/Logger.h"
#include "utils/JsonUtils.h"

#include <iostream>
#include <string>
#include <vector>
#include <memory>
#include <stdexcept>
#include <algorithm> // For std::transform

void runMigrations(Database& db) {
    LOG_INFO("Running database migrations...");
    std::vector<std::string> migration_files = {
        "migrations/V1__create_users_table.sql",
        "migrations/V2__add_admin_user.sql"
    };

    for (const auto& file : migration_files) {
        try {
            std::string path = "./" + file; // Adjust path for Docker context or local build
            std::ifstream t(path);
            if (!t.is_open()) {
                // If not found in current directory, try relative to executable
                std::string exec_path = crow::utility::get_current_executable_path();
                std::string exec_dir = exec_path.substr(0, exec_path.find_last_of('/'));
                path = exec_dir + "/" + file;
                t.open(path);
            }
            if (!t.is_open()) {
                LOG_FATAL("Migration file not found: %s", file.c_str());
                throw std::runtime_error("Migration file not found: " + file);
            }
            std::string sql((std::istreambuf_iterator<char>(t)),
                             std::istreambuf_iterator<char>());
            LOG_INFO("Applying migration: %s", file.c_str());
            db.execute(sql);
            LOG_INFO("Migration applied successfully: %s", file.c_str());
        } catch (const std::exception& e) {
            LOG_FATAL("Failed to apply migration %s: %s", file.c_str(), e.what());
            throw; // Re-throw to stop startup if migrations fail
        }
    }
    LOG_INFO("Database migrations completed.");
}


int main(int argc, char* argv[]) {
    // Initialize configuration from .env file
    Config::loadConfig(".env");
    Logger::setLogLevel(Config::getLogLevel());

    // Check for --init-db flag
    bool init_db_only = false;
    for (int i = 1; i < argc; ++i) {
        if (std::string(argv[i]) == "--init-db") {
            init_db_only = true;
            break;
        }
    }

    // Initialize database
    std::shared_ptr<Database> db = std::make_shared<Database>(Config::getDatabasePath());
    try {
        db->open();
        runMigrations(*db);
        if (init_db_only) {
            LOG_INFO("Database initialization complete. Exiting.");
            return 0;
        }
    } catch (const std::exception& e) {
        LOG_FATAL("Database setup failed: %s", e.what());
        return 1;
    }

    // Initialize services and controllers
    std::shared_ptr<AuthService> authService = std::make_shared<AuthService>(db);
    AuthController authController(authService, db);
    UserController userController(db);

    // Initialize Crow app
    crow::App<AuthMiddleware, ErrorHandlingMiddleware, RateLimitingMiddleware, CachingMiddleware> app;

    // Configure CORS (production-ready example)
    app.set_default_headers({
        {"Access-Control-Allow-Origin", "*"}, // In production, replace * with specific domains
        {"Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS"},
        {"Access-Control-Allow-Headers", "Content-Type, Authorization"},
        {"Access-Control-Allow-Credentials", "true"}
    });

    // Preflight OPTIONS requests handling
    CROW_ROUTE(app, "/<path>").methods(crow::HTTPMethod::Options)([/* this */](const crow::request& req, crow::response& res) {
        res.code = 204; // No Content
        res.end();
    });


    // --- API ROUTES ---

    // Auth Routes
    CROW_ROUTE(app, "/register").methods(crow::HTTPMethod::Post)(
        [&authController](const crow::request& req, crow::response& res) {
            return authController.registerUser(req, res);
        }
    );

    CROW_ROUTE(app, "/login").methods(crow::HTTPMethod::Post)(
        [&authController](const crow::request& req, crow::response& res) {
            return authController.loginUser(req, res);
        }
    );

    CROW_ROUTE(app, "/refresh-token").methods(crow::HTTPMethod::Post)(
        [&authController](const crow::request& req, crow::response& res) {
            return authController.refreshToken(req, res);
        }
    );

    // User Routes (Protected)
    // AuthMiddleware will be applied to these routes
    CROW_ROUTE(app, "/me").methods(crow::HTTPMethod::Get)(
        [&userController](const crow::request& req, crow::response& res) {
            return userController.getUserProfile(req, res);
        }
    );

    CROW_ROUTE(app, "/me").methods(crow::HTTPMethod::Put)(
        [&userController](const crow::request& req, crow::response& res) {
            return userController.updateUserProfile(req, res);
        }
    );

    CROW_ROUTE(app, "/me").methods(crow::HTTPMethod::Delete)(
        [&userController](const crow::request& req, crow::response& res) {
            return userController.deleteUserProfile(req, res);
        }
    );

    // Health Check
    CROW_ROUTE(app, "/health").methods(crow::HTTPMethod::Get)(
        [&db](crow::response& res) {
            // Simple health check: try to ping the database
            try {
                db->execute("SELECT 1");
                JsonUtils::sendSuccess(res, "healthy", crow::json::wvalue({{"timestamp", Logger::getCurrentTimestamp()}}));
            } catch (const std::exception& e) {
                LOG_ERROR("Health check failed: Database unreachable. Error: %s", e.what());
                JsonUtils::sendError(res, "unhealthy", "Database connection failed", 500);
            }
        }
    );

    // Start server
    LOG_INFO("AuthSystem starting on port %d...", Config::getAppPort());
    app.port(Config::getAppPort()).multithreaded().run();

    db->close(); // Close database connection on exit
    LOG_INFO("AuthSystem stopped.");

    return 0;
}
```