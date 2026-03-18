#include "JsonUtils.h"
#include "spdlog/spdlog.h" // For logging errors

namespace JsonUtils {

    nlohmann::json parseRequestBody(const crow::request& req) {
        try {
            return nlohmann::json::parse(req.body);
        } catch (const nlohmann::json::parse_error& e) {
            spdlog::warn("JSON parse error: {}", e.what());
            throw std::runtime_error("Invalid JSON format in request body.");
        }
    }

    void sendErrorResponse(crow::response& res, crow::HTTPResponseCode code, const std::string& message) {
        res.code = code;
        res.set_header("Content-Type", "application/json");
        res.write(generateErrorResponse(message, code));
        res.end();
    }

    void sendSuccessResponse(crow::response& res, crow::HTTPResponseCode code, const nlohmann::json& data) {
        res.code = code;
        res.set_header("Content-Type", "application/json");
        res.write(generateSuccessResponse(data));
        res.end();
    }

    std::string generateSuccessResponse(const nlohmann::json& data) {
        nlohmann::json response_json;
        response_json["status"] = "success";
        response_json["data"] = data;
        return response_json.dump();
    }

    std::string generateErrorResponse(const std::string& message, int status_code) {
        nlohmann::json error_json;
        error_json["status"] = "error";
        error_json["message"] = message;
        error_json["statusCode"] = status_code;
        return error_json.dump();
    }
}
```