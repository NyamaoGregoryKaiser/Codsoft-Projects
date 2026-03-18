#include "ModelController.h"
#include "common/JsonUtils.h"
#include "common/ErrorHandling.h"
#include "spdlog/spdlog.h"

ModelService ModelController::model_service; // Initialize static service instance

void ModelController::createModel(const crow::request& req, crow::response& res) {
    try {
        std::string user_id = AuthMiddleware::getUserIdFromRequest(req);
        nlohmann::json body = JsonUtils::parseRequestBody(req);

        // Ensure required fields are present
        if (!body.contains("name") || !body.contains("description")) {
            throw BadRequestError("Missing required fields: 'name' and 'description'.");
        }

        Model new_model_data = Model::fromJson(body);
        new_model_data.user_id = user_id; // Set user_id from token

        Model created_model = model_service.createModel(new_model_data);
        JsonUtils::sendSuccessResponse(res, crow::HTTPResponseCode::Created, created_model.toJson());
    } catch (const std::exception& e) {
        handle_exception(res, e);
    }
}

void ModelController::listModels(const crow::request& req, crow::response& res) {
    try {
        std::string user_id = AuthMiddleware::getUserIdFromRequest(req);
        std::vector<Model> models = model_service.listModels(user_id);

        nlohmann::json models_json = nlohmann::json::array();
        for (const auto& model : models) {
            models_json.push_back(model.toJson());
        }

        JsonUtils::sendSuccessResponse(res, crow::HTTPResponseCode::OK, models_json);
    } catch (const std::exception& e) {
        handle_exception(res, e);
    }
}

void ModelController::getModelById(const crow::request& req, crow::response& res, const std::string& model_id) {
    try {
        std::string user_id = AuthMiddleware::getUserIdFromRequest(req);
        std::optional<Model> model_opt = model_service.getModelById(model_id, user_id);

        if (!model_opt.has_value()) {
            throw NotFoundError("Model not found or not accessible by this user.");
        }

        JsonUtils::sendSuccessResponse(res, crow::HTTPResponseCode::OK, model_opt.value().toJson());
    } catch (const std::exception& e) {
        handle_exception(res, e);
    }
}

void ModelController::updateModel(const crow::request& req, crow::response& res, const std::string& model_id) {
    try {
        std::string user_id = AuthMiddleware::getUserIdFromRequest(req);
        nlohmann::json body = JsonUtils::parseRequestBody(req);

        Model updated_model_data;
        // Populate fields only if they are present in the request body
        if (body.contains("name")) updated_model_data.name = body["name"].get<std::string>();
        if (body.contains("description")) updated_model_data.description = body["description"].get<std::string>();
        if (body.contains("version")) updated_model_data.version = body["version"].get<std::string>();
        if (body.contains("model_path")) updated_model_data.model_path = body["model_path"].get<std::string>();
        if (body.contains("status")) updated_model_data.status = body["status"].get<std::string>();
        if (body.contains("metadata") && body["metadata"].is_object()) updated_model_data.metadata = body["metadata"];
        // Ensure that id and user_id are not updated from payload and are correctly set by service logic

        Model updated_model = model_service.updateModel(model_id, user_id, updated_model_data);
        JsonUtils::sendSuccessResponse(res, crow::HTTPResponseCode::OK, updated_model.toJson());
    } catch (const std::exception& e) {
        handle_exception(res, e);
    }
}

void ModelController::deleteModel(const crow::request& req, crow::response& res, const std::string& model_id) {
    try {
        std::string user_id = AuthMiddleware::getUserIdFromRequest(req);
        model_service.deleteModel(model_id, user_id);
        JsonUtils::sendSuccessResponse(res, crow::HTTPResponseCode::NoContent, nlohmann::json{{"message", "Model deleted successfully."}});
    } catch (const std::exception& e) {
        handle_exception(res, e);
    }
}
```