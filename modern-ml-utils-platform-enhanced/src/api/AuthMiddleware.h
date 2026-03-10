```cpp
#pragma once

#include <crow.h>
#include "../utils/Logger.h"
#include "../utils/Config.h"
#include "ErrorHandler.h" // For ApiException
#include <string>
#include <jwt-cpp/jwt.h> // Requires jwt-cpp library

namespace mlops {
namespace api {

struct AuthMiddleware {
    struct context {
        int user_id = -1; // Example: Store user ID if authenticated
        std::string user_role = "guest"; // Example: Store user role
    };

    void before_handle(crow::request& req, crow::response& res, context& ctx) {
        // If JWT authentication is disabled, skip auth
        if (!utils::Config::getInstance().getAuthEnabled()) {
            ctx.user_id = 1; // Dummy user for disabled auth
            ctx.user_role = "admin"; // Dummy role
            LOG_DEBUG("JWT authentication disabled. Skipping auth for request to " + req.url);
            return;
        }

        std::string auth_header = req.get_header("Authorization");
        if (auth_header.empty() || auth_header.rfind("Bearer ", 0) != 0) {
            res = ApiException(ApiException::ErrorCode::UNAUTHORIZED, "Authorization header missing or malformed.").toCrowResponse();
            res.end(); // Stop processing this request
            LOG_WARN("Auth: Missing or malformed Authorization header for " + req.url);
            return;
        }

        std::string token_str = auth_header.substr(7); // "Bearer " is 7 chars
        std::string jwt_secret = utils::Config::getInstance().getJwtSecret();

        try {
            auto decoded_token = jwt::decode(token_str);
            auto verifier = jwt::verify()
                                .allow_algorithm(jwt::algorithm::hs256{jwt_secret})
                                .with_issuer("mlops-core-service");

            verifier.verify(decoded_token); // Throws if verification fails

            // Extract claims
            if (decoded_token.has_claim("user_id")) {
                ctx.user_id = decoded_token.get_claim<int>("user_id");
            }
            if (decoded_token.has_claim("role")) {
                ctx.user_role = decoded_token.get_claim<std::string>("role");
            }
            LOG_DEBUG("Auth: Token verified for user ID: " + std::to_string(ctx.user_id) + ", role: " + ctx.user_role);

        } catch (const jwt::verification_error& e) {
            res = ApiException(ApiException::ErrorCode::UNAUTHORIZED, "Invalid or expired token: " + std::string(e.what())).toCrowResponse();
            res.end();
            LOG_WARN("Auth: JWT verification failed for " + req.url + ": " + e.what());
        } catch (const std::exception& e) {
            res = ApiException(ApiException::ErrorCode::UNAUTHORIZED, "Token processing error: " + std::string(e.what())).toCrowResponse();
            res.end();
            LOG_ERROR("Auth: Unexpected error during token processing for " + req.url + ": " + e.what());
        }
    }

    void after_handle(crow::request& /*req*/, crow::response& /*res*/, context& /*ctx*/) {
        // No action needed after handle
    }
};

} // namespace api
} // namespace mlops
```