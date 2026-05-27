#ifndef ML_UTILITIES_SYSTEM_MODEL_CONTROLLER_HPP
#define ML_UTILITIES_SYSTEM_MODEL_CONTROLLER_HPP

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
 * @brief Controller for ML Model-related API endpoints (CRUD for models).
 * Requires authentication for most operations.
 */
class ModelController {
private:
    std::shared_ptr<MLService> ml_service;

public:
    /**
     * @brief Constructs a ModelController and registers its routes with the Crow app.
     * @param app A reference to the Crow application instance.
     * @param service Shared pointer to the MLService.
     */
    ModelController(crow::App<
            LoggingMiddleware,
            ErrorMiddleware,
            AuthMiddleware,
            RateLimitMiddleware
        >& app, std::shared_ptr<MLService> service)
        : ml_service(std::move(service)) {

        if (!ml_service) {
            LOG_CRITICAL("ModelController initialized with a null MLService.");
            throw std::runtime_error("MLService cannot be null.");
        }
        LOG_DEBUG("ModelController initialized. Registering routes.");

        // Register new ML model (Authenticated)
        CROW_ROUTE(app, "/api/models")
            .methods("POST"_method)
            .template middleware<AuthMiddleware>()
            ([this](const crow::request& req, AuthMiddleware::context& ctx) {
            return handleRegisterModel(req, ctx);
        });

        // Get all ML models (Authenticated, Admin can see all, User can see their own)
        CROW_ROUTE(app, "/api/models")
            .methods("GET"_method)
            .template middleware<AuthMiddleware>()
            ([this](const crow::request& req, AuthMiddleware::context& ctx) {
            return handleGetAllModels(req, ctx);
        });

        // Get ML model by ID (Authenticated)
        CROW_ROUTE(app, "/api/models/<int>")
            .methods("GET"_method)
            .template middleware<AuthMiddleware>()
            ([this](const crow::request& req, AuthMiddleware::context& ctx, int model_id) {
            return handleGetModelById(req, ctx, model_id);
        });

        // Update ML model by ID (Authenticated, Owner or Admin)
        CROW_ROUTE(app, "/api/models/<int>")
            .methods("PUT"_method)
            .template middleware<AuthMiddleware>()
            ([this](const crow::request& req, AuthMiddleware::context& ctx, int model_id) {
            return handleUpdateModel(req, ctx, model_id);
        });

        // Delete ML model by ID (Authenticated, Owner or Admin)
        CROW_ROUTE(app, "/api/models/<int>")
            .methods("DELETE"_method)
            .template middleware<AuthMiddleware>()
            ([this](const crow::request& req, AuthMiddleware::context& ctx, int model_id) {
            return handleDeleteModel(req, ctx, model_id);
        });
    }

private:
    /**
     * @brief Handles requests to register a new ML model.
     * @param req The Crow request object.
     * @param ctx The AuthMiddleware context containing authenticated user info.
     * @return A Crow response with registered model info or error.
     */
    crow::response handleRegisterModel(const crow::request& req, AuthMiddleware::context& ctx) {
        LOG_INFO("Received request to register new model by user ID {}.", ctx.user_id);
        try {
            auto json_body = nlohmann::json::parse(req.body);

            // Required fields
            std::string name = json_body.at("name").get<std::string>();
            std::string version = json_body.at("version").get<std::string>();
            std::string type = json_body.at("type").get<std::string>();
            std::string file_path = json_body.at("filePath").get<std::string>(); // Placeholder for actual file upload/path

            // Optional fields
            std::string description = json_body.contains("description") ? json_body["description"].get<std::string>() : "";
            std::optional<std::string> metadata = std::nullopt;
            if (json_body.contains("metadata") && !json_body["metadata"].is_null()) {
                metadata = json_body["metadata"].dump(); // Store metadata as JSON string
            }

            if (name.empty() || version.empty() || type.empty() || file_path.empty()) {
                throw HttpError(crow::BAD_REQUEST, Constants::ERR_INVALID_INPUT);
            }

            MLModel new_model = ml_service->registerModel(name, version, type, file_path, description, ctx.user_id, metadata);

            nlohmann::json response_body = {
                {"message", "ML Model registered successfully."},
                {"model", new_model.toJson()}
            };
            return crow::response(crow::CREATED, response_body.dump());
        } catch (const nlohmann::json::parse_error& e) {
            LOG_WARN("Bad JSON in model registration request by user {}: {}", ctx.user_id, e.what());
            throw HttpError(crow::BAD_REQUEST, "Invalid JSON body.");
        } catch (const HttpError& e) {
            throw;
        } catch (const std::runtime_error& e) {
            LOG_ERROR("Error registering ML model by user {}: {}", ctx.user_id, e.what());
            throw HttpError(crow::BAD_REQUEST, e.what()); // Often bad request if model file invalid etc.
        } catch (const std::exception& e) {
            LOG_ERROR("Unhandled exception registering ML model by user {}: {}", ctx.user_id, e.what());
            throw HttpError(crow::INTERNAL_SERVER_ERROR, Constants::ERR_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * @brief Handles requests to get all ML models.
     * If user is admin, returns all models. If user, returns only models owned by them.
     * @param req The Crow request object.
     * @param ctx The AuthMiddleware context containing authenticated user info.
     * @return A Crow response with a list of ML models or error.
     */
    crow::response handleGetAllModels(const crow::request& req, AuthMiddleware::context& ctx) {
        LOG_INFO("Received request for all models by user ID {}.", ctx.user_id);
        try {
            std::vector<MLModel> models;
            if (ctx.hasRole(Constants::ROLE_ADMIN)) {
                models = ml_service->getAllModels();
            } else {
                models = ml_service->getModelsByOwner(ctx.user_id);
            }

            nlohmann::json models_json = nlohmann::json::array();
            for (const auto& model : models) {
                models_json.push_back(model.toJson());
            }

            nlohmann::json response_body = {
                {"message", "Models retrieved successfully."},
                {"models", models_json}
            };
            return crow::response(crow::OK, response_body.dump());
        } catch (const HttpError& e) {
            throw;
        } catch (const std::exception& e) {
            LOG_ERROR("Unhandled exception getting all ML models by user {}: {}", ctx.user_id, e.what());
            throw HttpError(crow::INTERNAL_SERVER_ERROR, Constants::ERR_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * @brief Handles requests to get an ML model by its ID.
     * Access is restricted: owner or admin can view.
     * @param req The Crow request object.
     * @param ctx The AuthMiddleware context containing authenticated user info.
     * @param model_id The ID of the model to retrieve.
     * @return A Crow response with ML model info or error.
     */
    crow::response handleGetModelById(const crow::request& req, AuthMiddleware::context& ctx, int model_id) {
        LOG_INFO("Received request for model ID {} by user ID {}.", model_id, ctx.user_id);
        try {
            std::optional<MLModel> model_opt = ml_service->getModelById(model_id);
            if (!model_opt) {
                throw HttpError(crow::NOT_FOUND, Constants::ERR_MODEL_NOT_FOUND);
            }

            // Authorization check: only owner or admin can view
            if (model_opt->owner_id != ctx.user_id && !ctx.hasRole(Constants::ROLE_ADMIN)) {
                throw HttpError(crow::FORBIDDEN, Constants::ERR_FORBIDDEN);
            }

            nlohmann::json response_body = model_opt->toJson();
            return crow::response(crow::OK, response_body.dump());
        } catch (const HttpError& e) {
            throw;
        } catch (const std::runtime_error& e) {
             if (std::string(e.what()) == Constants::ERR_MODEL_NOT_FOUND) {
                throw HttpError(crow::NOT_FOUND, Constants::ERR_MODEL_NOT_FOUND);
            }
            LOG_ERROR("Error getting ML model ID {} by user {}: {}", model_id, ctx.user_id, e.what());
            throw HttpError(crow::INTERNAL_SERVER_ERROR, Constants::ERR_INTERNAL_SERVER_ERROR);
        } catch (const std::exception& e) {
            LOG_ERROR("Unhandled exception getting ML model ID {} by user {}: {}", model_id, ctx.user_id, e.what());
            throw HttpError(crow::INTERNAL_SERVER_ERROR, Constants::ERR_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * @brief Handles requests to update an ML model.
     * Only owner or admin can update.
     * @param req The Crow request object.
     * @param ctx The AuthMiddleware context containing authenticated user info.
     * @param model_id The ID of the model to update.
     * @return A Crow response with updated model info or error.
     */
    crow::response handleUpdateModel(const crow::request& req, AuthMiddleware::context& ctx, int model_id) {
        LOG_INFO("Received request to update model ID {} by user ID {}.", model_id, ctx.user_id);
        try {
            auto json_body = nlohmann::json::parse(req.body);

            // First, check if model exists and user is authorized
            std::optional<MLModel> existing_model_opt = ml_service->getModelById(model_id);
            if (!existing_model_opt) {
                throw HttpError(crow::NOT_FOUND, Constants::ERR_MODEL_NOT_FOUND);
            }
            if (existing_model_opt->owner_id != ctx.user_id && !ctx.hasRole(Constants::ROLE_ADMIN)) {
                throw HttpError(crow::FORBIDDEN, Constants::ERR_FORBIDDEN);
            }

            // Extract optional update fields
            std::optional<std::string> name; if (json_body.contains("name")) name = json_body["name"].get<std::string>();
            std::optional<std::string> version; if (json_body.contains("version")) version = json_body["version"].get<std::string>();
            std::optional<std::string> type; if (json_body.contains("type")) type = json_body["type"].get<std::string>();
            std::optional<std::string> file_path; if (json_body.contains("filePath")) file_path = json_body["filePath"].get<std::string>();
            std::optional<std::string> description; if (json_body.contains("description")) description = json_body["description"].get<std::string>();
            std::optional<std::string> metadata_str; // Handle metadata specially for null
            if (json_body.contains("metadata")) {
                if (json_body["metadata"].is_null()) {
                    metadata_str = std::string("null"); // Indicate explicit null/clear
                } else {
                    metadata_str = json_body["metadata"].dump();
                }
            }


            MLModel updated_model = ml_service->updateModel(model_id, ctx.user_id, name, version, type, file_path, description, metadata_str);

            nlohmann::json response_body = {
                {"message", "ML Model updated successfully."},
                {"model", updated_model.toJson()}
            };
            return crow::response(crow::OK, response_body.dump());
        } catch (const nlohmann::json::parse_error& e) {
            LOG_WARN("Bad JSON in model update request by user {}: {}", ctx.user_id, e.what());
            throw HttpError(crow::BAD_REQUEST, "Invalid JSON body.");
        } catch (const HttpError& e) {
            throw;
        } catch (const std::runtime_error& e) {
            if (std::string(e.what()) == Constants::ERR_MODEL_NOT_FOUND) {
                throw HttpError(crow::NOT_FOUND, Constants::ERR_MODEL_NOT_FOUND);
            }
            LOG_ERROR("Error updating ML model ID {} by user {}: {}", model_id, ctx.user_id, e.what());
            throw HttpError(crow::BAD_REQUEST, e.what()); // Or 500 depending on nature of error
        } catch (const std::exception& e) {
            LOG_ERROR("Unhandled exception updating ML model ID {} by user {}: {}", model_id, ctx.user_id, e.what());
            throw HttpError(crow::INTERNAL_SERVER_ERROR, Constants::ERR_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * @brief Handles requests to delete an ML model.
     * Only owner or admin can delete.
     * @param req The Crow request object.
     * @param ctx The AuthMiddleware context containing authenticated user info.
     * @param model_id The ID of the model to delete.
     * @return A Crow response indicating success or error.
     */
    crow::response handleDeleteModel(const crow::request& req, AuthMiddleware::context& ctx, int model_id) {
        LOG_INFO("Received request to delete model ID {} by user ID {}.", model_id, ctx.user_id);
        try {
            // First, check if model exists and user is authorized
            std::optional<MLModel> existing_model_opt = ml_service->getModelById(model_id);
            if (!existing_model_opt) {
                throw HttpError(crow::NOT_FOUND, Constants::ERR_MODEL_NOT_FOUND);
            }
            if (existing_model_opt->owner_id != ctx.user_id && !ctx.hasRole(Constants::ROLE_ADMIN)) {
                throw HttpError(crow::FORBIDDEN, Constants::ERR_FORBIDDEN);
            }

            if (!ml_service->deleteModel(model_id, ctx.user_id)) {
                // This case should not be reached if previous checks passed, but good for robustness
                throw HttpError(crow::NOT_FOUND, Constants::ERR_MODEL_NOT_FOUND);
            }

            nlohmann::json response_body = {{"message", "ML Model deleted successfully."}};
            return crow::response(crow::OK, response_body.dump());
        } catch (const HttpError& e) {
            throw;
        } catch (const std::exception& e) {
            LOG_ERROR("Unhandled exception deleting ML model ID {} by user {}: {}", model_id, ctx.user_id, e.what());
            throw HttpError(crow::INTERNAL_SERVER_ERROR, Constants::ERR_INTERNAL_SERVER_ERROR);
        }
    }
};

#endif // ML_UTILITIES_SYSTEM_MODEL_CONTROLLER_HPP
```