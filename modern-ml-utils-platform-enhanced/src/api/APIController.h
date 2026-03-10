```cpp
#pragma once

#include <crow.h>
#include <memory>
#include "../database/DatabaseManager.h"
#include "../core/PredictionService.h"
#include "../utils/Logger.h"
#include "../utils/JsonUtils.h"
#include "ErrorHandler.h"
#include "AuthMiddleware.h" // For context access

namespace mlops {
namespace api {

class APIController {
public:
    APIController(crow::App<AuthMiddleware, ErrorHandler>& app,
                  std::shared_ptr<database::DatabaseManager> db_manager,
                  std::shared_ptr<core::PredictionService> prediction_service);

private:
    std::shared_ptr<database::DatabaseManager> db_manager_;
    std::shared_ptr<core::PredictionService> prediction_service_;

    // Helper for role-based authorization
    void authorize(const AuthMiddleware::context& ctx, const std::string& required_role);

    // Helper to parse JSON body
    nlohmann::json parseJsonBody(const crow::request& req);

    // --- Model Endpoints ---
    void registerModelRoutes(crow::App<AuthMiddleware, ErrorHandler>& app);

    // --- Model Version Endpoints ---
    void registerModelVersionRoutes(crow::App<AuthMiddleware, ErrorHandler>& app);

    // --- Prediction Endpoints ---
    void registerPredictionRoutes(crow::App<AuthMiddleware, ErrorHandler>& app);

    // --- Prediction Logs Endpoints ---
    void registerPredictionLogRoutes(crow::App<AuthMiddleware, ErrorHandler>& app);
};

} // namespace api
} // namespace mlops
```