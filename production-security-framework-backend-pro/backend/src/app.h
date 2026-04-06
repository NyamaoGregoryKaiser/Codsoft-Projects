#pragma once

#include <crow.h>
#include <iostream>

#include "utils/app_config.h"
#include "utils/logger.h"
#include "database/db_connection.h"

// Repositories
#include "repositories/user_repository.h"

// Services
#include "services/auth_service.h"
#include "services/user_service.h"

// Controllers
#include "controllers/auth_controller.h"
#include "controllers/user_controller.h"

// Middlewares
#include "middleware/error_middleware.h"
#include "middleware/rate_limit_middleware.h"
#include "middleware/auth_middleware.h" // Needed for context in user controller

class SecureApp {
public:
    SecureApp()
        : user_repo_(),
          argon2_hasher_(),
          jwt_manager_(),
          auth_service_(user_repo_, argon2_hasher_, jwt_manager_),
          user_service_(user_repo_, argon2_hasher_),
          auth_controller_(auth_service_),
          user_controller_(user_service_)
    {
        // Load configuration and initialize logging at startup
        AppConfig::Config::getInstance(); 
        Logger::AppLogger::get(); // Ensure logger is initialized

        // Initialize libsodium for Argon2Hasher
        if (sodium_init() < 0) {
            LOG_CRITICAL("libsodium initialization failed. Exiting.");
            exit(EXIT_FAILURE);
        }
        LOG_INFO("libsodium initialized successfully.");

        // Initialize DB connection (will connect on first use)
        // You could force an early connection check here if desired
        // Database::DBConnection::getConnection();
        
        LOG_INFO("Application initialized.");
    }

    void run() {
        auto& config = AppConfig::Config::getInstance();
        
        // Crow app instance with global middlewares
        crow::App<
            Middleware::ErrorHandler,
            Middleware::RateLimit,
            Middleware::Auth // Auth middleware is global but only triggered by routes that use it
        > app;

        // Set up controllers
        auth_controller_.setupRoutes(app);
        user_controller_.setupRoutes(app);

        // Serve static files for frontend (from 'frontend/public' relative to app root)
        app.set_static_directory("../frontend/public");
        
        // Fallback for SPA routing if needed (e.g., all non-API routes serve index.html)
        CROW_ROUTE(app, "/<path>")([&](crow::response& res, std::string path){
            if (path.rfind("api/", 0) != 0 && path.find(".") == std::string::npos) { // Not an API route and no file extension
                // Serve index.html for unknown routes (SPA fallback)
                res.set_static_file_info("../frontend/public/index.html");
                return;
            }
            res.code = 404;
            res.write("Not Found");
            res.end();
        });


        // CORS setup (basic)
        app.middleware_config().set_middleware<crow::CorsHandler>("*")
            .set_headers({"Authorization", "Content-Type"})
            .set_methods({crow::HTTPMethod::GET, crow::HTTPMethod::POST, crow::HTTPMethod::PUT, crow::HTTPMethod::DELETE, crow::HTTPMethod::OPTIONS});

        LOG_INFO("Starting server on port {}", config.app_port);
        app.port(config.app_port)
           .multithreaded()
           .run();

        // Close DB connection on shutdown
        Database::DBConnection::closeConnection();
        LOG_INFO("Application shut down.");
    }

private:
    // Repositories
    Repositories::UserRepository user_repo_;

    // Security Utilities
    Security::Argon2Hasher argon2_hasher_;
    Security::JwtManager jwt_manager_;

    // Services
    Services::AuthService auth_service_;
    Services::UserService user_service_;

    // Controllers
    Controllers::AuthController auth_controller_;
    Controllers::UserController user_controller_;
};