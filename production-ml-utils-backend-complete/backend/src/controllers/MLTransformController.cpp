#include "MLTransformController.h"
#include "common/JsonUtils.h"
#include "common/ErrorHandling.h"
#include "spdlog/spdlog.h"

MLTransformService MLTransformController::transform_service;

void MLTransformController::applyStandardScaler(const crow::request& req, crow::response& res) {
    try {
        nlohmann::json body = JsonUtils::parseRequestBody(req);
        TransformData input_data = TransformData::fromJson(body);

        TransformData output_data = transform_service.applyStandardScaler(input_data);
        JsonUtils::sendSuccessResponse(res, crow::HTTPResponseCode::OK, output_data.toJson());
    } catch (const std::exception& e) {
        handle_exception(res, e);
    }
}

void MLTransformController::applyMinMaxScaler(const crow::request& req, crow::response& res) {
    try {
        nlohmann::json body = JsonUtils::parseRequestBody(req);
        TransformData input_data = TransformData::fromJson(body);

        TransformData output_data = transform_service.applyMinMaxScaler(input_data);
        JsonUtils::sendSuccessResponse(res, crow::HTTPResponseCode::OK, output_data.toJson());
    } catch (const std::exception& e) {
        handle_exception(res, e);
    }
}

void MLTransformController::mockPrediction(const crow::request& req, crow::response& res, const std::string& model_id) {
    try {
        nlohmann::json body = JsonUtils::parseRequestBody(req);
        // Assuming input_features are directly in the body for this mock
        nlohmann::json input_features = body;

        nlohmann::json prediction_result = transform_service.mockPrediction(model_id, input_features);
        JsonUtils::sendSuccessResponse(res, crow::HTTPResponseCode::OK, prediction_result);
    } catch (const std::exception& e) {
        handle_exception(res, e);
    }
}
```