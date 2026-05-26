#pragma once

#include <crow.h>
#include <nlohmann/json.hpp>
#include "common/Constants.h"
#include "common/Error.h"
#include "utils/JWTUtils.h"
#include "utils/Logger.h"

namespace DataVizPro {

struct AuthMiddleware {
    struct context {
        std::string user_id;
        std::string username;
        // Add other user roles/permissions here
    };

    void before_handle(crow::request& req, crow::response& res, context& ctx) {
        // Skip auth for public routes (e.g., login, register)
        if (req.url.find(Constants::API_VERSION + "/auth") != std::string::npos ||
            req.url.find("/health") != std::string::npos) {
            return;
        }

        const std::string auth_header = req.get_header(Constants::AUTH_HEADER);
        if (auth_header.empty() || auth_header.rfind(Constants::BEARER_PREFIX, 0) != 0) {
            LOG_WARN("AuthMiddleware: Missing or invalid Authorization header.");
            throw DataVizError(ErrorCode::UNAUTHORIZED, "Missing or invalid authorization token", "", 401);
        }

        std::string token = auth_header.substr(Constants::BEARER_PREFIX.length());
        nlohmann::json payload = JWTUtils::verifyToken(token);

        if (payload.is_null() || !payload.contains("userId") || !payload.contains("username")) {
            LOG_WARN("AuthMiddleware: JWT verification failed or missing required claims.");
            throw DataVizError(ErrorCode::UNAUTHORIZED, "Invalid or expired authorization token", "", 401);
        }

        ctx.user_id = payload["userId"].get<std::string>();
        ctx.username = payload["username"].get<std::string>();
        LOG_DEBUG("AuthMiddleware: User '{}' (ID: {}) authenticated.", ctx.username, ctx.user_id);
    }

    void after_handle(crow::request& req, crow::response& res, context& ctx) {
        // Optional: Perform actions after a request is handled, e.g., logging response time.
    }
};

} // namespace DataVizPro
```