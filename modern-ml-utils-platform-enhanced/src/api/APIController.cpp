```cpp
#include "APIController.h"
#include <stdexcept>
#include <string>

namespace mlops {
namespace api {

APIController::APIController(crow::App<AuthMiddleware, ErrorHandler>& app,
                             std::shared_ptr<database::DatabaseManager> db_manager,
                             std::shared_ptr<core::PredictionService> prediction_service)
    : db_manager_(std::move(db_manager)),
      prediction_service_(std::move(prediction_service)) {
    if (!db_manager_ || !prediction_service_) {
        throw std::runtime_error("DatabaseManager or PredictionService cannot be null in APIController.");
    }
    LOG_INFO("APIController initialized. Registering routes...");
    registerModelRoutes(app);
    registerModelVersionRoutes(app);
    registerPredictionRoutes(app);
    registerPredictionLogRoutes(app);
}

void APIController::authorize(const AuthMiddleware::context& ctx, const std::string& required_role) {
    // Simple role-based authorization
    // For production, this would be more granular (e.g., resource-based permissions)
    if (ctx.user_role != "admin" && ctx.user_role != required_role) {
        throw ApiException(ApiException::ErrorCode::FORBIDDEN, "Access denied. Requires " + required_role + " role.");
    }
}

nlohmann::json APIController::parseJsonBody(const crow::request& req) {
    if (!req.body.empty()) {
        try {
            return nlohmann::json::parse(req.body);
        } catch (const nlohmann::json::parse_error& e) {
            LOG_WARN("Failed to parse request JSON body: " + std::string(e.what()));
            throw ApiException(ApiException::ErrorCode::BAD_REQUEST, "Invalid JSON in request body.");
        }
    }
    return nlohmann::json::object(); // Return empty object if body is empty
}

// --- Model Endpoints ---
void APIController::registerModelRoutes(crow::App<AuthMiddleware, ErrorHandler>& app) {
    // Create Model (Protected: Admin only)
    CROW_BP_ROUTE(app, "/api/v1/models")
        .methods(crow::HTTPMethod::POST)
        .template CROW_MIDDLEWARES(AuthMiddleware)
        ([this](const crow::request& req, AuthMiddleware::context& ctx) {
            try {
                authorize(ctx, "admin");

                nlohmann::json req_body = parseJsonBody(req);
                ModelDTO model_dto;
                model_dto.name = req_body.at("name").get<std::string>();
                model_dto.description = req_body.at("description").get<std::string>();

                if (auto new_model = db_manager_->createModel(model_dto)) {
                    LOG_INFO("Model created: " + new_model->name);
                    return crow::response(201, utils::modelDtoToJson(*new_model).dump());
                } else {
                    throw ApiException(ApiException::ErrorCode::CONFLICT, "Failed to create model. Name might already exist.");
                }
            } catch (const nlohmann::json::exception& e) {
                throw ApiException(ApiException::ErrorCode::BAD_REQUEST, "Missing or invalid field in request: " + std::string(e.what()));
            } catch (const std::exception& e) {
                return ErrorHandler::handleException(e);
            }
        });

    // Get All Models (Protected: Viewer/Admin)
    CROW_BP_ROUTE(app, "/api/v1/models")
        .methods(crow::HTTPMethod::GET)
        .template CROW_MIDDLEWARES(AuthMiddleware)
        ([this](AuthMiddleware::context& ctx) {
            try {
                authorize(ctx, "viewer");
                auto models = db_manager_->getModels();
                nlohmann::json models_json = nlohmann::json::array();
                for (const auto& model : models) {
                    models_json.push_back(utils::modelDtoToJson(model));
                }
                return crow::response(200, models_json.dump());
            } catch (const std::exception& e) {
                return ErrorHandler::handleException(e);
            }
        });

    // Get Model by ID (Protected: Viewer/Admin)
    CROW_BP_ROUTE(app, "/api/v1/models/<int>")
        .methods(crow::HTTPMethod::GET)
        .template CROW_MIDDLEWARES(AuthMiddleware)
        ([this](int model_id, AuthMiddleware::context& ctx) {
            try {
                authorize(ctx, "viewer");
                if (auto model = db_manager_->getModelById(model_id)) {
                    return crow::response(200, utils::modelDtoToJson(*model).dump());
                } else {
                    throw ApiException(ApiException::ErrorCode::NOT_FOUND, "Model with ID " + std::to_string(model_id) + " not found.");
                }
            } catch (const std::exception& e) {
                return ErrorHandler::handleException(e);
            }
        });

    // Update Model (Protected: Admin only)
    CROW_BP_ROUTE(app, "/api/v1/models/<int>")
        .methods(crow::HTTPMethod::PUT)
        .template CROW_MIDDLEWARES(AuthMiddleware)
        ([this](int model_id, const crow::request& req, AuthMiddleware::context& ctx) {
            try {
                authorize(ctx, "admin");

                nlohmann::json req_body = parseJsonBody(req);
                ModelDTO model_dto;
                model_dto.name = req_body.at("name").get<std::string>();
                model_dto.description = req_body.at("description").get<std::string>();

                if (auto updated_model = db_manager_->updateModel(model_id, model_dto)) {
                    LOG_INFO("Model updated: " + std::to_string(model_id));
                    return crow::response(200, utils::modelDtoToJson(*updated_model).dump());
                } else {
                    throw ApiException(ApiException::ErrorCode::NOT_FOUND, "Model with ID " + std::to_string(model_id) + " not found or failed to update.");
                }
            } catch (const nlohmann::json::exception& e) {
                throw ApiException(ApiException::ErrorCode::BAD_REQUEST, "Missing or invalid field in request: " + std::string(e.what()));
            } catch (const std::exception& e) {
                return ErrorHandler::handleException(e);
            }
        });

    // Delete Model (Protected: Admin only)
    CROW_BP_ROUTE(app, "/api/v1/models/<int>")
        .methods(crow::HTTPMethod::DELETE)
        .template CROW_MIDDLEWARES(AuthMiddleware)
        ([this](int model_id, AuthMiddleware::context& ctx) {
            try {
                authorize(ctx, "admin");
                // Check if model exists before attempting to delete
                if (!db_manager_->getModelById(model_id)) {
                    throw ApiException(ApiException::ErrorCode::NOT_FOUND, "Model with ID " + std::to_string(model_id) + " not found.");
                }
                db_manager_->deleteModel(model_id);
                LOG_INFO("Model deleted: " + std::to_string(model_id));
                return crow::response(204); // No Content
            } catch (const std::exception& e) {
                return ErrorHandler::handleException(e);
            }
        });
}

// --- Model Version Endpoints ---
void APIController::registerModelVersionRoutes(crow::App<AuthMiddleware, ErrorHandler>& app) {
    // Create Model Version (Protected: Admin only)
    CROW_BP_ROUTE(app, "/api/v1/models/<int>/versions")
        .methods(crow::HTTPMethod::POST)
        .template CROW_MIDDLEWARES(AuthMiddleware)
        ([this](int model_id, const crow::request& req, AuthMiddleware::context& ctx) {
            try {
                authorize(ctx, "admin");

                nlohmann::json req_body = parseJsonBody(req);
                ModelVersionDTO version_dto;
                version_dto.model_id = model_id;
                version_dto.version_tag = req_body.at("version_tag").get<std::string>();
                version_dto.model_path = req_body.at("model_path").get<std::string>(); // Path to the actual model file/data
                version_dto.is_active = req_body.count("is_active") ? req_body.at("is_active").get<bool>() : false;
                version_dto.parameters = utils::jsonToModelParameters(req_body.at("parameters"));
                version_dto.notes = req_body.count("notes") ? req_body.at("notes").get<std::string>() : "";

                // If setting this version to active, deactivate all other versions for this model
                if (version_dto.is_active) {
                    db_manager_->deactivateAllModelVersions(model_id);
                }

                if (auto new_version = db_manager_->createModelVersion(version_dto)) {
                    LOG_INFO("Model version created: " + new_version->version_tag);
                    return crow::response(201, utils::modelVersionDtoToJson(*new_version).dump());
                } else {
                    throw ApiException(ApiException::ErrorCode::CONFLICT, "Failed to create model version. Model ID " + std::to_string(model_id) + " might not exist or version tag already in use.");
                }
            } catch (const nlohmann::json::exception& e) {
                throw ApiException(ApiException::ErrorCode::BAD_REQUEST, "Missing or invalid field in request: " + std::string(e.what()));
            } catch (const std::exception& e) {
                return ErrorHandler::handleException(e);
            }
        });

    // Get All Model Versions for a Model (Protected: Viewer/Admin)
    CROW_BP_ROUTE(app, "/api/v1/models/<int>/versions")
        .methods(crow::HTTPMethod::GET)
        .template CROW_MIDDLEWARES(AuthMiddleware)
        ([this](int model_id, AuthMiddleware::context& ctx) {
            try {
                authorize(ctx, "viewer");
                auto versions = db_manager_->getModelVersions(model_id);
                nlohmann::json versions_json = nlohmann::json::array();
                for (const auto& version : versions) {
                    versions_json.push_back(utils::modelVersionDtoToJson(version));
                }
                return crow::response(200, versions_json.dump());
            } catch (const std::exception& e) {
                return ErrorHandler::handleException(e);
            }
        });

    // Get Model Version by ID (Protected: Viewer/Admin)
    CROW_BP_ROUTE(app, "/api/v1/models/<int>/versions/<int>")
        .methods(crow::HTTPMethod::GET)
        .template CROW_MIDDLEWARES(AuthMiddleware)
        ([this](int model_id, int version_id, AuthMiddleware::context& ctx) {
            try {
                authorize(ctx, "viewer");
                if (auto version = db_manager_->getModelVersionById(version_id)) {
                    if (*version->model_id != model_id) { // Ensure version belongs to the specified model
                        throw ApiException(ApiException::ErrorCode::NOT_FOUND, "Model version ID " + std::to_string(version_id) + " does not belong to model ID " + std::to_string(model_id) + ".");
                    }
                    return crow::response(200, utils::modelVersionDtoToJson(*version).dump());
                } else {
                    throw ApiException(ApiException::ErrorCode::NOT_FOUND, "Model version with ID " + std::to_string(version_id) + " not found.");
                }
            } catch (const std::exception& e) {
                return ErrorHandler::handleException(e);
            }
        });

    // Update Model Version (Protected: Admin only)
    CROW_BP_ROUTE(app, "/api/v1/models/<int>/versions/<int>")
        .methods(crow::HTTPMethod::PUT)
        .template CROW_MIDDLEWARES(AuthMiddleware)
        ([this](int model_id, int version_id, const crow::request& req, AuthMiddleware::context& ctx) {
            try {
                authorize(ctx, "admin");

                nlohmann::json req_body = parseJsonBody(req);
                ModelVersionDTO version_dto;
                // Fetch existing to fill in non-updatable fields and ensure ownership
                auto existing_version_opt = db_manager_->getModelVersionById(version_id);
                if (!existing_version_opt || *existing_version_opt->model_id != model_id) {
                    throw ApiException(ApiException::ErrorCode::NOT_FOUND, "Model version ID " + std::to_string(version_id) + " not found or does not belong to model ID " + std::to_string(model_id) + ".");
                }
                version_dto = *existing_version_opt; // Start with existing data

                // Update only specified fields
                if (req_body.count("version_tag")) version_dto.version_tag = req_body.at("version_tag").get<std::string>();
                if (req_body.count("model_path")) version_dto.model_path = req_body.at("model_path").get<std::string>();
                if (req_body.count("is_active")) version_dto.is_active = req_body.at("is_active").get<bool>();
                if (req_body.count("parameters")) version_dto.parameters = utils::jsonToModelParameters(req_body.at("parameters"));
                if (req_body.count("notes")) version_dto.notes = req_body.at("notes").get<std::string>();

                // If setting this version to active, deactivate all other versions for this model
                if (version_dto.is_active && !existing_version_opt->is_active) { // Only if status is changing to active
                    db_manager_->deactivateAllModelVersions(model_id);
                }
                
                if (auto updated_version = db_manager_->updateModelVersion(version_id, version_dto)) {
                    LOG_INFO("Model version updated: " + std::to_string(version_id));
                    prediction_service_->reloadModelVersion(version_id); // Invalidate cache and force reload
                    return crow::response(200, utils::modelVersionDtoToJson(*updated_version).dump());
                } else {
                    throw ApiException(ApiException::ErrorCode::CONFLICT, "Failed to update model version. Version tag might already exist.");
                }
            } catch (const nlohmann::json::exception& e) {
                throw ApiException(ApiException::ErrorCode::BAD_REQUEST, "Missing or invalid field in request: " + std::string(e.what()));
            } catch (const std::exception& e) {
                return ErrorHandler::handleException(e);
            }
        });

    // Delete Model Version (Protected: Admin only)
    CROW_BP_ROUTE(app, "/api/v1/models/<int>/versions/<int>")
        .methods(crow::HTTPMethod::DELETE)
        .template CROW_MIDDLEWARES(AuthMiddleware)
        ([this](int model_id, int version_id, AuthMiddleware::context& ctx) {
            try {
                authorize(ctx, "admin");
                // Ensure version belongs to the specified model
                auto version_opt = db_manager_->getModelVersionById(version_id);
                if (!version_opt || *version_opt->model_id != model_id) {
                    throw ApiException(ApiException::ErrorCode::NOT_FOUND, "Model version ID " + std::to_string(version_id) + " not found or does not belong to model ID " + std::to_string(model_id) + ".");
                }

                db_manager_->deleteModelVersion(version_id);
                prediction_service_->reloadModelVersion(version_id); // Invalidate cache
                LOG_INFO("Model version deleted: " + std::to_string(version_id));
                return crow::response(204);
            } catch (const std::exception& e) {
                return ErrorHandler::handleException(e);
            }
        });
}

// --- Prediction Endpoints ---
void APIController::registerPredictionRoutes(crow::App<AuthMiddleware, ErrorHandler>& app) {
    // Serve Prediction by Model ID and Version ID (Protected: Predictor/Admin)
    CROW_BP_ROUTE(app, "/api/v1/predict/<int>/<int>")
        .methods(crow::HTTPMethod::POST)
        .template CROW_MIDDLEWARES(AuthMiddleware)
        ([this](int model_id, int version_id, const crow::request& req, AuthMiddleware::context& ctx) {
            try {
                authorize(ctx, "predictor");

                nlohmann::json req_body = parseJsonBody(req);
                PredictionInput input_data = utils::jsonToPredictionInput(req_body);

                PredictionOutput output = prediction_service_->predict(model_id, version_id, input_data);
                return crow::response(200, utils::predictionOutputToJson(output).dump());
            } catch (const std::exception& e) {
                return ErrorHandler::handleException(e);
            }
        });

    // Serve Prediction by Model ID and Version Tag (Protected: Predictor/Admin)
    CROW_BP_ROUTE(app, "/api/v1/predict/<int>/<string>")
        .methods(crow::HTTPMethod::POST)
        .template CROW_MIDDLEWARES(AuthMiddleware)
        ([this](int model_id, std::string version_tag, const crow::request& req, AuthMiddleware::context& ctx) {
            try {
                authorize(ctx, "predictor");

                nlohmann::json req_body = parseJsonBody(req);
                PredictionInput input_data = utils::jsonToPredictionInput(req_body);
                
                PredictionOutput output = prediction_service_->predictByVersionTag(model_id, version_tag, input_data);
                return crow::response(200, utils::predictionOutputToJson(output).dump());
            } catch (const std::exception& e) {
                return ErrorHandler::handleException(e);
            }
        });
}

// --- Prediction Logs Endpoints ---
void APIController::registerPredictionLogRoutes(crow::App<AuthMiddleware, ErrorHandler>& app) {
    // Get Prediction Logs for a Model Version (Protected: Viewer/Admin)
    CROW_BP_ROUTE(app, "/api/v1/models/<int>/versions/<int>/logs")
        .methods(crow::HTTPMethod::GET)
        .template CROW_MIDDLEWARES(AuthMiddleware)
        ([this](int model_id, int version_id, AuthMiddleware::context& ctx) {
            try {
                authorize(ctx, "viewer");
                // Ensure model version exists and belongs to the specified model
                auto version_opt = db_manager_->getModelVersionById(version_id);
                if (!version_opt || *version_opt->model_id != model_id) {
                    throw ApiException(ApiException::ErrorCode::NOT_FOUND, "Model version ID " + std::to_string(version_id) + " not found or does not belong to model ID " + std::to_string(model_id) + ".");
                }

                auto logs = db_manager_->getPredictionLogs(version_id);
                nlohmann::json logs_json = nlohmann::json::array();
                for (const auto& log : logs) {
                    logs_json.push_back(utils::predictionLogDtoToJson(log));
                }
                return crow::response(200, logs_json.dump());
            } catch (const std::exception& e) {
                return ErrorHandler::handleException(e);
            }
        });
}

} // namespace api
} // namespace mlops
```