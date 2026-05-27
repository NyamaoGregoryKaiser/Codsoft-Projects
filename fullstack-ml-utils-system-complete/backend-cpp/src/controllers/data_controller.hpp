#ifndef ML_UTILITIES_SYSTEM_DATA_CONTROLLER_HPP
#define ML_UTILITIES_SYSTEM_DATA_CONTROLLER_HPP

#include "crow.h"
#include "nlohmann/json.hpp"
#include "../services/ml_service.hpp"
#include "../middleware/error_middleware.hpp"
#include "../middleware/auth_middleware.hpp"
#include "../utils/logger.hpp"
#include "../common/constants.hpp"
#include <memory>
#include <stdexcept>

/**
 * @brief Controller for ML Data and Inference-related API endpoints.
 * Handles triggering inference and retrieving past data points.
 * Requires authentication.
 */
class DataController {
private:
    std::shared_ptr<MLService> ml_service;

public:
    /**
     * @brief Constructs a DataController and registers its routes with the Crow app.
     * @param app A reference to the Crow application instance.
     * @param service Shared pointer to the MLService.
     */
    DataController(crow::App<
            LoggingMiddleware,
            ErrorMiddleware,
            AuthMiddleware,
            RateLimitMiddleware
        >& app, std::shared_ptr<MLService> service)
        : ml_service(std::move(service)) {

        if (!ml_service) {
            LOG_CRITICAL("DataController initialized with a null MLService.");
            throw std::runtime_error("MLService cannot be null.");
        }
        LOG_DEBUG("DataController initialized. Registering routes.");

        // Perform inference on a model (Authenticated)
        CROW_ROUTE(app, "/api/models/<int>/infer")
            .methods("POST"_method)
            .template middleware<AuthMiddleware>()
            ([this](const crow::request& req, AuthMiddleware::context& ctx, int model_id) {
            return handlePerformInference(req, ctx, model_id);
        });

        // Get a specific data point for a model (Authenticated, by owner)
        CROW_ROUTE(app, "/api/models/<int>/data/<int>")
            .methods("GET"_method)
            .template middleware<AuthMiddleware>()
            ([this](const crow::request& req, AuthMiddleware::context& ctx, int model_id, int dp_id) {
            return handleGetDataPoint(req, ctx, model_id, dp_id);
        });

        // Get all data points for a specific model (Authenticated, by owner)
        CROW_ROUTE(app, "/api/models/<int>/data")
            .methods("GET"_method)
            .template middleware<AuthMiddleware>()
            ([this](const crow::request& req, AuthMiddleware::context& ctx, int model_id) {
            return handleGetDataPointsByModel(req, ctx, model_id);
        });
    }

private:
    /**
     * @brief Handles requests to perform ML inference using a specific model.
     * @param req The Crow request object. The body should contain the input data for the model.
     * @param ctx The AuthMiddleware context containing authenticated user info.
     * @param model_id The ID of the model to use for inference.
     * @return A Crow response with the prediction result and data point info, or error.
     */
    crow::response handlePerformInference(const crow::request& req, AuthMiddleware::context& ctx, int model_id) {
        LOG_INFO("Received inference request for model ID {} by user ID {}.", model_id, ctx.user_id);
        try {
            // Check if model exists (and implicitly if user is authorized to use it, through MLService logic)
            std::optional<MLModel> model_opt = ml_service->getModelById(model_id);
            if (!model_opt) {
                throw HttpError(crow::NOT_FOUND, Constants::ERR_MODEL_NOT_FOUND);
            }
            // Further authorization: ensure the user can use this model for inference
            // For simplicity, we allow any authenticated user to infer on any registered model
            // For stricter control: if (model_opt->owner_id != ctx.user_id && !ctx.hasRole(Constants::ROLE_ADMIN)) { ... }

            if (req.body.empty()) {
                throw HttpError(crow::BAD_REQUEST, "Request body cannot be empty for inference.");
            }

            // The body is the raw input data for the ML model, expected to be JSON.
            // We store it as a string and let MLInferenceEngine handle parsing.
            DataPoint result_dp = ml_service->performInference(model_id, ctx.user_id, req.body);

            nlohmann::json response_body = {
                {"message", "Inference performed successfully."},
                {"dataPoint", result_dp.toJson()}
            };
            return crow::response(crow::OK, response_body.dump());
        } catch (const nlohmann::json::parse_error& e) {
            LOG_WARN("Bad JSON input for inference request for model {} by user {}: {}", model_id, ctx.user_id, e.what());
            throw HttpError(crow::BAD_REQUEST, "Invalid JSON input data for inference.");
        } catch (const HttpError& e) {
            throw;
        } catch (const std::runtime_error& e) {
            if (std::string(e.what()) == Constants::ERR_MODEL_NOT_FOUND) {
                throw HttpError(crow::NOT_FOUND, Constants::ERR_MODEL_NOT_FOUND);
            }
            LOG_ERROR("Error performing inference for model ID {} by user {}: {}", model_id, ctx.user_id, e.what());
            throw HttpError(crow::BAD_REQUEST, e.what()); // Often bad request if input data invalid etc.
        } catch (const std::exception& e) {
            LOG_ERROR("Unhandled exception performing inference for model ID {} by user {}: {}", model_id, ctx.user_id, e.what());
            throw HttpError(crow::INTERNAL_SERVER_ERROR, Constants::ERR_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * @brief Handles requests to get a specific data point (inference record).
     * Only the user who initiated the inference can retrieve their data points.
     * @param req The Crow request object.
     * @param ctx The AuthMiddleware context containing authenticated user info.
     * @param model_id The ID of the model associated with the data point (for routing consistency).
     * @param dp_id The ID of the data point to retrieve.
     * @return A Crow response with data point info or error.
     */
    crow::response handleGetDataPoint(const crow::request& req, AuthMiddleware::context& ctx, int model_id, int dp_id) {
        LOG_INFO("Received request for data point ID {} for model {} by user ID {}.", dp_id, model_id, ctx.user_id);
        try {
            std::optional<DataPoint> dp_opt = ml_service->getDataPoint(dp_id, ctx.user_id);
            if (!dp_opt || dp_opt->model_id != model_id) { // Also ensure it matches the model in URL
                throw HttpError(crow::NOT_FOUND, "Data point not found for the specified model and user.");
            }

            nlohmann::json response_body = dp_opt->toJson();
            return crow::response(crow::OK, response_body.dump());
        } catch (const HttpError& e) {
            throw;
        } catch (const std::exception& e) {
            LOG_ERROR("Unhandled exception getting data point ID {} for model {} by user {}: {}",
                      dp_id, model_id, ctx.user_id, e.what());
            throw HttpError(crow::INTERNAL_SERVER_ERROR, Constants::ERR_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * @brief Handles requests to get all data points for a specific model by the authenticated user.
     * Only the user who initiated the inference can retrieve their data points.
     * @param req The Crow request object.
     * @param ctx The AuthMiddleware context containing authenticated user info.
     * @param model_id The ID of the model.
     * @return A Crow response with a list of data points or error.
     */
    crow::response handleGetDataPointsByModel(const crow::request& req, AuthMiddleware::context& ctx, int model_id) {
        LOG_INFO("Received request for all data points for model ID {} by user ID {}.", model_id, ctx.user_id);
        try {
            // First, check if the model exists and is accessible to the user (owner or admin)
            std::optional<MLModel> model_opt = ml_service->getModelById(model_id);
            if (!model_opt) {
                throw HttpError(crow::NOT_FOUND, Constants::ERR_MODEL_NOT_FOUND);
            }
            if (model_opt->owner_id != ctx.user_id && !ctx.hasRole(Constants::ROLE_ADMIN)) {
                throw HttpError(crow::FORBIDDEN, Constants::ERR_FORBIDDEN);
            }

            std::vector<DataPoint> data_points = ml_service->getDataPointsByModelAndUser(model_id, ctx.user_id);

            nlohmann::json data_points_json = nlohmann::json::array();
            for (const auto& dp : data_points) {
                data_points_json.push_back(dp.toJson());
            }

            nlohmann::json response_body = {
                {"message", "Data points retrieved successfully."},
                {"dataPoints", data_points_json}
            };
            return crow::response(crow::OK, response_body.dump());
        } catch (const HttpError& e) {
            throw;
        } catch (const std::exception& e) {
            LOG_ERROR("Unhandled exception getting data points for model {} by user {}: {}",
                      model_id, ctx.user_id, e.what());
            throw HttpError(crow::INTERNAL_SERVER_ERROR, Constants::ERR_INTERNAL_SERVER_ERROR);
        }
    }
};

#endif // ML_UTILITIES_SYSTEM_DATA_CONTROLLER_HPP
```