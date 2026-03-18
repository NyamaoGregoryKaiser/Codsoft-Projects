#pragma once

#include "nlohmann/json.hpp"
#include "crow.h"
#include <string>

namespace JsonUtils {
    nlohmann::json parseRequestBody(const crow::request& req);
    void sendErrorResponse(crow::response& res, crow::HTTPResponseCode code, const std::string& message);
    void sendSuccessResponse(crow::response& res, crow::HTTPResponseCode code, const nlohmann::json& data);
    std::string generateSuccessResponse(const nlohmann::json& data);
    std::string generateErrorResponse(const std::string& message, int status_code = 400);
}
```