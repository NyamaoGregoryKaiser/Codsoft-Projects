```cpp
#ifndef OPTIDB_APP_H
#define OPTIDB_APP_H

#include <crow.h>
#include <memory>

#include "config/config.h"
#include "db/postgres_connection.h"
#include "services/auth_service.h"
#include "services/target_db_service.h"
#include "services/optimization_engine.h"
#include "middleware/auth_middleware.h"
#include "middleware/logging_middleware.h"
#include "middleware/error_middleware.h"
#include "controllers/auth_controller.h"
#include "controllers/target_db_controller.h"
#include "utils/logger.h"

// Forward declaration for middleware to avoid circular dependency in headers
namespace middleware {
    class AuthMiddleware;
    class LoggingMiddleware;
    class ErrorMiddleware;
}

class OptiDBApp {
public:
    OptiDBApp();
    void run();

private:
    crow::SimpleApp app;
    OptiDBConfig config;
    std::shared_ptr<PostgresConnection> db_connection;
    std::shared_ptr<AuthService> auth_service;
    std::shared_ptr<TargetDbService> target_db_service;
    std::shared_ptr<OptimizationEngine> optimization_engine;

    // Middleware instances
    std::shared_ptr<middleware::ErrorMiddleware> error_middleware;
    std::shared_ptr<middleware::LoggingMiddleware> logging_middleware;
    std::shared_ptr<middleware::AuthMiddleware> auth_middleware;

    // Controllers
    std::shared_ptr<AuthController> auth_controller;
    std::shared_ptr<TargetDbController> target_db_controller;

    void setup_dependencies();
    void setup_middleware();
    void setup_routes();
};

#endif // OPTIDB_APP_H
```