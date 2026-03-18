#pragma once

#include "crow.h"
#include "middleware/AuthMiddleware.h"
#include "middleware/LoggingMiddleware.h"
#include "middleware/CacheMiddleware.h"
#include "middleware/RateLimitMiddleware.h"

// Controllers
#include "controllers/AuthController.h"
#include "controllers/UserController.h"
#include "controllers/ModelController.h"
#include "controllers/MLTransformController.h"

// Define a common App type for convenience with all middlewares
using MLApp = crow::App<
    LoggingMiddleware,
    AuthMiddleware,
    CacheMiddleware,
    RateLimitMiddleware
>;

void register_routes(MLApp& app) {
    // --- Public Routes (No Auth Required) ---
    CROW_ROUTE(app, "/api/v1/auth/register").methods(crow::HTTPMethod::POST)
    ([&](const crow::request& req) {
        return AuthController::registerUser(req);
    });

    CROW_ROUTE(app, "/api/v1/auth/login").methods(crow::HTTPMethod::POST)
    ([&](const crow::request& req) {
        return AuthController::loginUser(req);
    });

    // --- Authenticated Routes (AuthMiddleware will check token) ---
    // User Routes
    CROW_ROUTE(app, "/api/v1/users/me").methods(crow::HTTPMethod::GET)
    ([&](const crow::request& req, crow::response& res) {
        UserController::getCurrentUser(req, res); // User ID from AuthMiddleware context
    });

    // Model Management Routes
    CROW_ROUTE(app, "/api/v1/models")
        .methods(crow::HTTPMethod::POST)
        ([&](const crow::request& req, crow::response& res) {
            ModelController::createModel(req, res);
        })
        .methods(crow::HTTPMethod::GET)
        ([&](const crow::request& req, crow::response& res) {
            ModelController::listModels(req, res);
        });

    CROW_ROUTE(app, "/api/v1/models/<string>") // <string> for model_id
        .methods(crow::HTTPMethod::GET)
        ([&](const crow::request& req, crow::response& res, std::string model_id) {
            ModelController::getModelById(req, res, model_id);
        })
        .methods(crow::HTTPMethod::PUT)
        ([&](const crow::request& req, crow::response& res, std::string model_id) {
            ModelController::updateModel(req, res, model_id);
        })
        .methods(crow::HTTPMethod::DELETE)
        ([&](const crow::request& req, crow::response& res, std::string model_id) {
            ModelController::deleteModel(req, res, model_id);
        });

    // ML Transformation Routes
    CROW_ROUTE(app, "/api/v1/transforms/standard_scaler").methods(crow::HTTPMethod::POST)
    ([&](const crow::request& req, crow::response& res) {
        MLTransformController::applyStandardScaler(req, res);
    });

    CROW_ROUTE(app, "/api/v1/transforms/minmax_scaler").methods(crow::HTTPMethod::POST)
    ([&](const crow::request& req, crow::response& res) {
        MLTransformController::applyMinMaxScaler(req, res);
    });

    // Basic prediction endpoint (mocked)
    CROW_ROUTE(app, "/api/v1/predict/<string>").methods(crow::HTTPMethod::POST)
    ([&](const crow::request& req, crow::response& res, std::string model_id) {
        MLTransformController::mockPrediction(req, res, model_id);
    });

    // Root endpoint for health check
    CROW_ROUTE(app, "/").methods(crow::HTTPMethod::GET)
    ([]() {
        return crow::response(200, "{\"status\": \"ok\", \"message\": \"ML Utilities API is running!\"}");
    });
}
```